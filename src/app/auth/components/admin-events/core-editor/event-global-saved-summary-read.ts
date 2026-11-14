import { forkJoin, map, of, switchMap } from 'rxjs';
import { EventOccurrenceStatus, EventProgramItemStatus, ParticipantSignupKind } from '../../../../core/enums/event';

import type { AdminEventTimeline, AdminEventTimelineOccurrence } from '../../../../core/interfaces/i-admin-event-timeline';
import type { AdminEventPolicyDraft } from '../../../../core/interfaces/i-admin-event-policy';
import type { AdminEffectivePolicyResult, AdminGlobalCalendarResult } from '../../../../core/interfaces/i-admin-global-event';
import type { IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import type { AdminGlobalPublicationOccurrence } from '../../../../core/interfaces/i-admin-global-event-publication';
import type { IEventParticipantAvailability } from '../../../../core/interfaces/i-event-participant';
import type { EventGlobalSavedSnapshot, SavedProgramDate } from '../../../../core/interfaces/i-event-global-saved-summary';
import type { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { isValidIsoDate, parseIsoDate } from '../../../../core/utils/date';
import { assertEdgeContract } from '../../../../core/utils/edge-contract';
import { parseTimeLabelToMinutes } from '../../../../core/utils/time-format';
import { timeZoneDateToTimestamp } from '../../../../core/utils/time-zone';

type SavedCity = AdminGlobalCalendarResult['cities'][number];

// An independent read must not reset the editor's selected city or unsaved forms.
export function readEventGlobalSavedSummary(admin: EventAdmin, coreId: string) {
  return admin.getCoreDetail(coreId).pipe(switchMap(core => core === null ? of(null) : forkJoin({
    calendar: admin.getGlobalCalendar(coreId),
    policy: admin.getEffectivePolicy(coreId),
    policyDraft: admin.getPolicyDraft(coreId),
  }).pipe(switchMap(({ calendar, policy, policyDraft }) => {
    assertEdgeContract(core.id === coreId, 'savedSummary.core', 'the requested saved Core');
    validateCalendar(core, calendar, policy, policyDraft);
    return forkJoin({
      edition: admin.getEditionDetail(calendar.mainEditionId),
      timelines: forkJoin(calendar.cities.map(city => admin.getTimeline(city.editionId))),
    }).pipe(map(({ edition, timelines }): EventGlobalSavedSnapshot => {
      const main = calendar.cities.find(city => city.isMain);
      assertEdgeContract(edition !== null && main !== undefined && edition.id === main.editionId &&
        edition.eventCoreId === coreId && edition.city === main.city && edition.slug === main.slug && edition.timezone === main.timezone,
      'savedSummary.edition', 'the saved main Edition belonging to the requested Core');
      const cities = calendar.cities.map((city, index) => {
        const timeline = timelines[index];
        assertEdgeContract(timeline !== undefined && timeline.eventId === city.editionId && timeline.eventCoreId === coreId &&
          timeline.timezone === city.timezone, 'savedSummary.timeline', 'the requested city Edition timeline');
        if (city.isMain) {
          assertEdgeContract(edition.occurrences.length === timeline.occurrences.length && edition.occurrences.every(occurrence =>
            timeline.occurrences.some(row => row.occurrenceId === occurrence.id && row.date === occurrence.date)),
          'savedSummary.mainOccurrences', 'matching saved main Edition occurrence IDs and dates');
        }
        return { city, dates: savedProgramDates(calendar, city, timeline), timeline };
      });
      return { core, calendar, policy, policyDraft, edition, cities };
    }));
  }))));
}

export function selectGlobalSignupRecovery(calendar: AdminGlobalCalendarResult, timelines: readonly AdminEventTimeline[],
  availability: ReadonlyMap<string, readonly IEventParticipantAvailability[]>, now: number): AdminGlobalPublicationOccurrence[] {
  return calendar.globalDates.filter(day => day.status === 'scheduled').flatMap(day =>
    day.cityOccurrences.flatMap(local => {
      const city = calendar.cities.find(entry => entry.editionId === local.editionId && entry.isActive);
      const occurrence = timelines.find(timeline => timeline.eventId === local.editionId)?.occurrences
        .find(row => row.occurrenceId === local.occurrenceId && row.date === day.date);
      if (!city || !occurrence || local.decision !== 'included' || local.unlinkedSameDate || local.occurrenceId === null ||
        local.publishedAt === null || local.occurrenceStatus !== EventOccurrenceStatus.Published ||
        occurrence.status !== EventOccurrenceStatus.Published || occurrence.capacityPolicy !== 'independent' ||
        occurrence.participantSignupOpenedAt !== null) return [];
      const recoverable = availability.get(local.editionId)?.some(item => {
        if (item.occurrenceId !== occurrence.occurrenceId ||
          !['not_open', 'scheduled', 'available', 'full'].includes(item.availabilityStatus) ||
          (occurrence.participantSignupKind !== ParticipantSignupKind.Both && item.scope !== occurrence.participantSignupKind)) return false;
        if (item.scope === 'whole_event') {
          const blocks = calendar.datedTimeBlocks.find(row => row.globalOccurrenceId === day.globalOccurrenceId)
            ?.cities.find(row => row.editionId === local.editionId && row.publishedSnapshot)?.timeBlocks;
          return blocks !== undefined && blocks.length > 0 && blocks.every(block =>
            startsInFuture(day.date, block.startTime, block.startDayOffset, city.timezone, now));
        }
        return occurrence.rows.some(row => row.source === 'manual' && row.activity === null && row.session !== null &&
          row.status === 'confirmed' && row.programItemId === item.programItemId &&
          row.programStatus === EventProgramItemStatus.Published &&
          startsInFuture(day.date, row.startTime, row.startDayOffset, city.timezone, now));
      });
      return recoverable ? [{ editionId: local.editionId, occurrenceId: local.occurrenceId, date: day.date }] : [];
    }));
}

export function selectGlobalProgramRecovery(snapshot: EventGlobalSavedSnapshot): AdminGlobalPublicationOccurrence[] {
  return snapshot.calendar.globalDates.filter(day => day.status === 'scheduled').flatMap(day =>
    day.cityOccurrences.flatMap(local => {
      const city = snapshot.cities.find(entry => entry.city.editionId === local.editionId && entry.city.isActive);
      const occurrence = city?.timeline.occurrences.find(row => row.occurrenceId === local.occurrenceId && row.date === day.date);
      if (!city || !occurrence || local.decision !== 'included' || local.unlinkedSameDate || local.occurrenceId === null ||
        local.publishedAt === null || local.occurrenceStatus !== occurrence.status ||
        ![EventOccurrenceStatus.Published, EventOccurrenceStatus.ParticipantSignupClosed].includes(occurrence.status)) return [];
      return occurrence.rows.some(row => row.source === 'manual' && row.programStatus === EventProgramItemStatus.Approved)
        ? [{ editionId: local.editionId, occurrenceId: local.occurrenceId, date: day.date }] : [];
    }));
}

// Recovery qualification uses real published starts; the admin RPC remains the write authority.
function startsInFuture(dateIso: string, time: string, dayOffset: number, timezone: string, now: number): boolean {
  const date = parseIsoDate(dateIso);
  const minutes = parseTimeLabelToMinutes(time);
  if (date === null || minutes === null) return false;
  date.setDate(date.getDate() + dayOffset);
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  const timestamp = timeZoneDateToTimestamp(date, timezone);
  return timestamp !== null && Date.parse(timestamp) > now;
}

function validateCalendar(core: IEventCoreDetail, calendar: AdminGlobalCalendarResult,
  policy: AdminEffectivePolicyResult, draft: AdminEventPolicyDraft): void {
  assertEdgeContract(calendar.coreId === core.id && calendar.coreKey === core.key && calendar.calendarLifecycle === 'global' &&
    calendar.cities.filter(city => city.isMain).length === 1 &&
    calendar.cities.some(city => city.isMain && city.editionId === calendar.mainEditionId) &&
    new Set(calendar.cities.map(city => city.editionId)).size === calendar.cities.length &&
    calendar.cities.length === core.editions.length && calendar.cities.every(city =>
      core.editions.some(edition => edition.id === city.editionId && edition.slug === city.slug && edition.city === city.city)),
  'savedSummary.calendar', 'the saved Global calendar and its Core Editions');
  assertEdgeContract(policy.coreId === core.id && policy.coreKey === core.key && policy.lifecycle === 'global' &&
    policy.mainEditionId === calendar.mainEditionId && policy.editions.length === calendar.cities.length &&
    calendar.cities.every(city => policy.editions.filter(edition => edition.editionId === city.editionId &&
      edition.isMain === city.isMain && edition.city === city.city && edition.slug === city.slug).length === 1) &&
    draft.coreId === core.id && draft.canonicalBaseline.coreId === core.id &&
    draft.canonicalBaseline.mainEditionId === calendar.mainEditionId,
  'savedSummary.policy', 'saved effective policy and a separate policy draft for the same Core');
  assertEdgeContract(new Set(calendar.globalDates.map(day => day.date)).size === calendar.globalDates.length &&
    new Set(calendar.globalDates.map(day => day.globalOccurrenceId)).size === calendar.globalDates.length &&
    calendar.globalDates.every(day => isValidIsoDate(day.date) &&
      new Set(day.cityOccurrences.map(city => city.editionId)).size === day.cityOccurrences.length &&
      day.cityOccurrences.every(city => calendar.cities.some(saved => saved.editionId === city.editionId))),
  'savedSummary.dates', 'unique saved calendar dates and city identities');
}

function savedProgramDates(calendar: AdminGlobalCalendarResult, city: SavedCity, timeline: AdminEventTimeline): SavedProgramDate[] {
  const occurrences = new Map(timeline.occurrences.map(occurrence => [occurrence.occurrenceId, occurrence]));
  assertEdgeContract(occurrences.size === timeline.occurrences.length &&
    new Set(timeline.occurrences.map(occurrence => occurrence.date)).size === timeline.occurrences.length,
  'savedSummary.occurrences', 'unique local occurrence IDs and dates');
  const linked = new Set<string>();
  const dates = calendar.globalDates.map((day): SavedProgramDate => {
    const local = day.cityOccurrences.find(row => row.editionId === city.editionId);
    const occurrence = local?.occurrenceId ? occurrences.get(local.occurrenceId) : null;
    if (local?.occurrenceId) {
      assertEdgeContract(occurrence !== undefined && occurrence !== null && occurrence.date === day.date &&
        !linked.has(occurrence.occurrenceId), 'savedSummary.localDate', 'the saved local occurrence ID and calendar date');
      linked.add(occurrence.occurrenceId);
    }
    return {
      key: day.globalOccurrenceId, date: day.date, globalStatus: day.status,
      participation: local?.decision ?? 'missing', occurrenceStatus: occurrence?.status ?? null,
      counts: occurrence ? countProgram(occurrence) : null,
    };
  });
  // Historical or unlinked local dates remain visible rather than disappearing from the counts.
  for (const occurrence of timeline.occurrences) {
    if (!linked.has(occurrence.occurrenceId)) dates.push({
      key: occurrence.occurrenceId, date: occurrence.date, globalStatus: null, participation: 'unlinked',
      occurrenceStatus: occurrence.status, counts: countProgram(occurrence),
    });
  }
  return dates.sort((a, b) => a.date.localeCompare(b.date));
}

function countProgram(occurrence: AdminEventTimelineOccurrence): { pending: number; confirmed: number } {
  const counts = { pending: 0, confirmed: 0 };
  for (const row of occurrence.rows) {
    if (row.programStatus === EventProgramItemStatus.Withdrawn || row.programStatus === EventProgramItemStatus.Rejected) continue;
    if (row.programItemId !== null || row.session !== null || (row.source === 'manual' && row.activity !== null)) {
      counts[row.status]++;
    }
  }
  return counts;
}
