import { EventOccurrenceStatus, EventProgramItemStatus } from '../../enums/event';
import type { ConvertAdminStaffingRealizationToEventResult } from '../../interfaces/admin-staffing-realization';
import type { AdminEventTimeline } from '../../interfaces/i-admin-event-timeline';
import type { AdminEffectivePolicyResult, AdminGlobalCalendarResult } from '../../interfaces/i-admin-global-event';
import type { IAdminEventDetail, IEventCoreDetail } from '../../interfaces/i-event-admin';
import { isValidIsoDate } from '../../utils/date';
import { assertEdgeContract, readEdgeNonNegativeInteger, readEdgeObject, readEdgeUuid } from '../../utils/edge-contract';
import { assertAdminEventTimelineScope } from '../events/admin-event-timeline.contract';

export function assertStaffingEventConversion(result: ConvertAdminStaffingRealizationToEventResult, realizationId: string): void {
  const object = readEdgeObject(result, 'staffingConversion');
  const keys = ['converted', 'realizationId', 'eventCoreId', 'eventId', 'calendarLifecycle', 'occurrences',
    'programItemCount', 'public', 'calendar', 'policy', ...(result.converted === true ? ['emptySlotCount'] : [])];
  assertEdgeContract(Object.keys(object).length === keys.length && keys.every(key => Object.hasOwn(object, key)) &&
    typeof result.converted === 'boolean' && typeof result.public === 'boolean' && result.realizationId === realizationId &&
    result.calendarLifecycle === 'global', 'staffingConversion', 'the exact frozen FIRST or REPLAY response');
  for (const value of [result.realizationId, result.eventCoreId, result.eventId]) readEdgeUuid(value, 'staffingConversion.id');
  assertEdgeContract(result.eventCoreId !== result.eventId, 'staffingConversion.id', 'distinct Core and Edition identities');
  readEdgeNonNegativeInteger(result.programItemCount, 'staffingConversion.programItemCount');
  assertEdgeContract(Array.isArray(result.occurrences) &&
    new Set(result.occurrences.map(row => row.occurrenceId)).size === result.occurrences.length &&
    new Set(result.occurrences.map(row => row.date)).size === result.occurrences.length,
  'staffingConversion.occurrences', 'unique local occurrence IDs and dates');
  for (const [index, row] of result.occurrences.entries()) {
    readEdgeUuid(row.occurrenceId, 'staffingConversion.occurrenceId');
    assertEdgeContract(Object.keys(readEdgeObject(row, 'staffingConversion.occurrence')).length === 2 &&
      isValidIsoDate(row.date) && (index === 0 || result.occurrences[index - 1].date < row.date),
    'staffingConversion.date', 'chronologically ordered dated occurrences');
  }
  assertStaffingGlobalScope(result.eventCoreId, result.eventId, result.calendar, result.policy);
  const linked = result.calendar.globalDates.flatMap(day => day.cityOccurrences
    .filter(city => city.editionId === result.eventId && city.occurrenceId !== null)
    .map(city => ({ occurrenceId: city.occurrenceId, date: day.date })));
  assertEdgeContract(new Set(linked.map(city => city.occurrenceId)).size === linked.length && linked.every(city =>
    result.occurrences.some(row => row.occurrenceId === city.occurrenceId && row.date === city.date)),
  'staffingConversion.calendar', 'matching linked occurrences without discarding unlinked local history');
  if (result.converted) {
    readEdgeNonNegativeInteger(result.emptySlotCount, 'staffingConversion.emptySlotCount');
    assertEdgeContract(linked.length === result.occurrences.length && result.public === false &&
      result.occurrences.length >= 1 && result.occurrences.length <= 366 &&
      result.policy.global.price.amount === null &&
      result.policy.global.price.basis === null && result.policy.global.price.currency === 'PLN' &&
      result.calendar.schedule.kind === 'exact_dates',
    'staffingConversion.first', 'a private exact-date import with unconfigured pricing');
  }
}

function assertStaffingGlobalScope(coreId: string, eventId: string,
  calendar: AdminGlobalCalendarResult, policy: AdminEffectivePolicyResult): void {
  readEdgeObject(calendar, 'staffingConversion.calendar');
  readEdgeObject(policy, 'staffingConversion.policy');
  assertEdgeContract(calendar.coreId === coreId && calendar.mainEditionId === eventId && calendar.calendarLifecycle === 'global' &&
    Number.isInteger(calendar.calendarRevision) && typeof calendar.revision === 'string' &&
    Array.isArray(calendar.cities) && new Set(calendar.cities.map(city => city.editionId)).size === calendar.cities.length &&
    calendar.cities.filter(city => city.isMain).length === 1 && calendar.cities.some(city => city.isMain && city.editionId === eventId) &&
    Array.isArray(calendar.globalDates) && new Set(calendar.globalDates.map(day => day.globalOccurrenceId)).size === calendar.globalDates.length &&
    new Set(calendar.globalDates.map(day => day.date)).size === calendar.globalDates.length &&
    policy.coreId === coreId && policy.mainEditionId === eventId && policy.lifecycle === 'global' &&
    Array.isArray(policy.editions) && policy.editions.length === calendar.cities.length &&
    calendar.cities.every(city => policy.editions.filter(row => row.editionId === city.editionId && row.isMain === city.isMain).length === 1),
  'staffingConversion.scope', 'the canonical Global calendar and policy for the linked main Edition');
  for (const day of calendar.globalDates) {
    readEdgeUuid(day.globalOccurrenceId, 'staffingConversion.globalDateId');
    assertEdgeContract(isValidIsoDate(day.date) && Array.isArray(day.cityOccurrences) &&
      new Set(day.cityOccurrences.map(city => city.editionId)).size === day.cityOccurrences.length &&
      day.cityOccurrences.every(city => calendar.cities.some(row => row.editionId === city.editionId) &&
        city.occurrenceId !== day.globalOccurrenceId),
    'staffingConversion.globalDate', 'shared dates and distinct local occurrences');
  }
}

export function assertStaffingEventImportReadback(core: IEventCoreDetail, edition: IAdminEventDetail,
  calendar: AdminGlobalCalendarResult, policy: AdminEffectivePolicyResult, timeline: AdminEventTimeline,
  result: ConvertAdminStaffingRealizationToEventResult | null): void {
  assertStaffingGlobalScope(core.id, edition.id, calendar, policy);
  assertAdminEventTimelineScope(timeline, edition, core.id);
  assertEdgeContract(core.key === calendar.coreKey && policy.coreKey === core.key &&
    new Set(core.editions.map(row => row.id)).size === core.editions.length &&
    core.editions.length === calendar.cities.length && calendar.cities.every(city =>
      core.editions.some(row => row.id === city.editionId && row.city === city.city && row.slug === city.slug)) &&
    calendar.globalDates.every(day => day.cityOccurrences.filter(city => city.editionId === edition.id && city.occurrenceId !== null)
      .every(city => edition.occurrences.some(row => row.id === city.occurrenceId && row.date === day.date && row.status === city.occurrenceStatus))),
  'staffingConversion.readback', 'the authoritative Global Core, Edition, calendar and programme with retained local history');
  const rows = timeline.occurrences.flatMap(day => day.rows);
  const mainCity = calendar.cities.find(city => city.editionId === edition.id);
  assertEdgeContract(mainCity !== undefined && mainCity.city === edition.city && mainCity.slug === edition.slug &&
    mainCity.timezone === edition.timezone && timeline.timezone === edition.timezone &&
    timeline.occurrences.every(day => edition.occurrences.some(row => row.id === day.occurrenceId && row.status === day.status)),
  'staffingConversion.localScope', 'matching saved city metadata, occurrence statuses and timezone');
  const slots = rows.flatMap(row => row.source === 'manual' ? [row.slotId] : []);
  const programs = rows.flatMap(row => row.programItemId === null ? [] : [row.programItemId]);
  assertEdgeContract(new Set(slots).size === slots.length && new Set(programs).size === programs.length,
    'staffingConversion.program', 'unique canonical Manual slots and programme items across all retained sources');
  if (!result) return;
  assertEdgeContract(result.eventCoreId === core.id && result.eventId === edition.id && result.public === core.hasPublicPage &&
    result.occurrences.length === edition.occurrences.length && result.occurrences.every(row =>
      edition.occurrences.some(day => day.id === row.occurrenceId && day.date === row.date)) && result.programItemCount === programs.length,
  'staffingConversion.confirmation', 'the same saved identities, dates, public state and programme count');
  if (result.converted) {
    assertEdgeContract(timeline.origin === 'manual' && !core.isActive && !core.hasPublicPage && !edition.isActive && !edition.currentlyPublic &&
      edition.occurrences.every(row => calendar.globalDates.some(day => day.date === row.date &&
        day.cityOccurrences.some(city => city.editionId === edition.id && city.occurrenceId === row.id))) &&
      edition.occurrences.every(row => row.status === EventOccurrenceStatus.Planned && row.publishedAt === null &&
        row.participantSignupOpenedAt === null && row.activeParticipantCount === 0) &&
      rows.filter(row => row.programItemId === null).length === result.emptySlotCount &&
      rows.every(row => row.source === 'manual' && row.activity === null && row.status === 'pending' &&
        (row.programItemId === null || (row.programStatus === EventProgramItemStatus.Approved && row.host !== null &&
          row.session !== null && row.sourceKind !== null && row.sourceSessionId !== null))) &&
      policy.global.price.amount === null && policy.global.price.basis === null,
    'staffingConversion.firstReadback', 'the imported private draft, approved sessions, empty slots and unconfigured pricing');
  }
}
