import { forkJoin, map, switchMap } from 'rxjs';

import type { AdminEventTimeline, AdminEventTimelineOccurrence } from '../../../../core/interfaces/i-admin-event-timeline';
import type { AdminEventPolicyDraft } from '../../../../core/interfaces/i-admin-event-policy';
import type { AdminEffectivePolicyResult, AdminGlobalCalendarResult } from '../../../../core/interfaces/i-admin-global-event';
import type { IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import type { EventGlobalSavedSnapshot, SavedProgramDate } from '../../../../core/interfaces/i-event-global-saved-summary';
import type { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { isValidIsoDate } from '../../../../core/utils/date';
import { assertEdgeContract } from '../../../../core/utils/edge-contract';

type SavedCity = AdminGlobalCalendarResult['cities'][number];

// An independent read must not reset the editor's selected city or unsaved forms.
export function readEventGlobalSavedSummary(admin: EventAdmin, coreId: string) {
  return forkJoin({
    core: admin.getCoreDetail(coreId),
    calendar: admin.getGlobalCalendar(coreId),
    policy: admin.getEffectivePolicy(coreId),
    policyDraft: admin.getPolicyDraft(coreId),
  }).pipe(switchMap(({ core, calendar, policy, policyDraft }) => {
    assertEdgeContract(core !== null && core.id === coreId, 'savedSummary.core', 'the requested saved Core');
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
        return { city, dates: savedProgramDates(calendar, city, timeline) };
      });
      return { core, calendar, policy, policyDraft, edition, cities };
    }));
  }));
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
    if (row.programItemId !== null || row.session !== null || (row.source === 'manual' && row.activity !== null)) {
      counts[row.status]++;
    }
  }
  return counts;
}
