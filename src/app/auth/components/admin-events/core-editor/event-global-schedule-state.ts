import type { AdminGlobalCalendarResult, CityExclusion, EventGlobalCalendarChange, EventGlobalSchedule,
  GlobalTimeBlockInput } from '../../../../core/interfaces/i-admin-global-event';
import type { IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import { assertEdgeContract } from '../../../../core/utils/edge-contract';
import { isValidIsoDate, toIsoDate } from '../../../../core/utils/date';
import { timestampToTimeZoneDate } from '../../../../core/utils/time-zone';

export type GlobalScheduleIssue = 'protected' | 'offScope' | 'historical' | 'conflict' | 'readback';

export class EventGlobalScheduleError extends Error {
  constructor(readonly issue: GlobalScheduleIssue) {
    super(`[GLOBAL_SCHEDULE] ${issue}`);
  }
}

export interface GlobalScheduleCommand extends EventGlobalCalendarChange {
  baseline: AdminGlobalCalendarResult;
  savedRevision: number | null;
  appliedRevision: number | null;
}

export function activeScheduleBlocks(calendar: AdminGlobalCalendarResult): GlobalTimeBlockInput[] {
  return calendar.timeBlocks.map(({ blockId, ...block }) => block);
}

export function activeCityExclusions(calendar: AdminGlobalCalendarResult): CityExclusion[] {
  return calendar.globalDates.filter(day => day.status === 'scheduled').flatMap(day => day.cityOccurrences
    .filter(city => city.decision === 'excluded').map(city => ({ editionId: city.editionId, date: day.date })));
}

export function sameSchedule(left: EventGlobalSchedule, right: EventGlobalSchedule): boolean {
  const key = (schedule: EventGlobalSchedule): string => {
    if (schedule.kind === 'single') return JSON.stringify(['single', schedule.date]);
    if (schedule.kind === 'exact_dates') return JSON.stringify(['exact_dates', [...schedule.dates].sort()]);
    return JSON.stringify(['recurring', schedule.recurrenceKind, schedule.interval, schedule.startDate, schedule.endDate,
      [...schedule.exdates].sort(), schedule.recurrenceKind === 'WEEKLY' ? [...schedule.byweekday].sort() :
        schedule.recurrenceKind === 'MONTHLY_DAY_OF_MONTH' ? schedule.dayOfMonth : [schedule.monthlyNth, schedule.monthlyWeekday]]);
  };
  return key(left) === key(right);
}

export function sameScheduleBlocks(left: GlobalTimeBlockInput[], right: GlobalTimeBlockInput[]): boolean {
  const key = (blocks: GlobalTimeBlockInput[]): string => JSON.stringify([...blocks].sort((a, b) => a.position - b.position)
    .map(b => [b.position, b.label, b.requiredGmCount, b.startDayOffset, b.startTime, b.endDayOffset, b.endTime]));
  return key(left) === key(right);
}

export function sameCityExclusions(left: CityExclusion[], right: CityExclusion[]): boolean {
  const key = (rows: CityExclusion[]): string => JSON.stringify(rows.map(row => `${row.editionId}:${row.date}`).sort());
  return key(left) === key(right);
}

export function validateScheduleContext(core: IEventCoreDetail, calendar: AdminGlobalCalendarResult): void {
  assertEdgeContract(calendar.coreId === core.id && calendar.coreKey === core.key &&
    Number.isInteger(calendar.calendarRevision) && calendar.calendarRevision >= 0 &&
    Number.isInteger(calendar.draftRevision) && calendar.draftRevision >= 0 &&
    (calendar.pendingDraft === null || (calendar.pendingDraft !== undefined && Number.isInteger(calendar.pendingDraft.revision) &&
      calendar.pendingDraft.revision > 0)) &&
    calendar.draftRevision === (calendar.pendingDraft?.revision ?? 0) &&
    Array.isArray(calendar.timeBlocks) && Array.isArray(calendar.globalDates) && Array.isArray(calendar.datedTimeBlocks),
  'globalSchedule', 'the canonical calendar and its separate numeric revisions');
  const today = mainCityToday(calendar);
  if (calendar.calendarLifecycle !== 'global' || core.isActive || core.hasPublicPage ||
    !calendar.cities.some(city => city.editionId === calendar.mainEditionId && city.isMain) ||
    calendar.cities.some(city => city.isActive) ||
    calendar.globalDates.some(day => day.date >= today && day.cityOccurrences.some(city => city.protected || city.publishedAt || city.unlinkedSameDate ||
      (city.occurrenceStatus !== null && city.occurrenceStatus !== 'planned'))) ||
    calendar.datedTimeBlocks.some(day => day.date >= today && (day.source === 'published_snapshot' || day.cities.some(city => city.publishedSnapshot)))) {
    throw new EventGlobalScheduleError('protected');
  }
  const pending = calendar.pendingDraft;
  if (pending && (!Array.isArray(pending.cityExclusions) || !Array.isArray(pending.timeBlocks) ||
    !Array.isArray(pending.candidateDates) || !sameScheduleBlocks(pending.timeBlocks, activeScheduleBlocks(calendar)) ||
    !sameCityExclusions(pending.cityExclusions, activeCityExclusions(calendar).filter(row => pending.candidateDates.includes(row.date))))) {
    throw new EventGlobalScheduleError('offScope');
  }
}

export function preserveScheduleExclusions(calendar: AdminGlobalCalendarResult, candidateDates: string[]): CityExclusion[] {
  const rows = calendar.pendingDraft ? calendar.pendingDraft.cityExclusions : activeCityExclusions(calendar);
  assertEdgeContract(Array.isArray(rows) && candidateDates.every(isValidIsoDate) &&
    rows.every(row => isValidIsoDate(row.date) && calendar.cities.some(city => city.editionId === row.editionId)),
  'globalSchedule', 'canonical city exclusions and authoritative candidate dates');
  const today = mainCityToday(calendar);
  if (rows.some(row => row.date < today)) throw new EventGlobalScheduleError('historical');
  return rows.filter(row => candidateDates.includes(row.date)).map(row => ({ ...row }));
}

function mainCityToday(calendar: AdminGlobalCalendarResult): string {
  const main = calendar.cities.find(city => city.editionId === calendar.mainEditionId && city.isMain);
  assertEdgeContract(main !== undefined, 'globalSchedule', 'the main city');
  const localToday = timestampToTimeZoneDate(new Date().toISOString(), main.timezone);
  assertEdgeContract(localToday !== null, 'globalSchedule', 'the main city local date');
  return toIsoDate(localToday);
}

export function sameScheduleChange(left: EventGlobalCalendarChange, right: EventGlobalCalendarChange): boolean {
  return left.coreId === right.coreId && sameSchedule(left.schedule, right.schedule) &&
    sameScheduleBlocks(left.timeBlocks, right.timeBlocks) && sameCityExclusions(left.cityExclusions, right.cityExclusions);
}

export function matchesSavedSchedule(calendar: AdminGlobalCalendarResult, command: GlobalScheduleCommand): boolean {
  const pending = calendar.pendingDraft;
  return calendar.calendarRevision === command.baseline.calendarRevision && pending !== null &&
    pending.revision === (command.savedRevision ?? command.baseline.draftRevision + 1) &&
    sameScheduleChange({ coreId: calendar.coreId, ...pending }, command);
}

export function matchesAppliedSchedule(calendar: AdminGlobalCalendarResult, command: GlobalScheduleCommand): boolean {
  return calendar.pendingDraft === null && calendar.calendarRevision ===
    (command.appliedRevision ?? command.baseline.calendarRevision + 1) && sameScheduleChange({ coreId: calendar.coreId,
      schedule: calendar.schedule, timeBlocks: activeScheduleBlocks(calendar), cityExclusions: activeCityExclusions(calendar) }, command) &&
    preservesDatedSchedule(command.baseline, calendar);
}

function preservesDatedSchedule(previous: AdminGlobalCalendarResult, current: AdminGlobalCalendarResult): boolean {
  return previous.globalDates.every(day => {
    const retained = current.globalDates.find(row => row.date === day.date);
    return !retained || retained.globalOccurrenceId === day.globalOccurrenceId;
  }) && previous.datedTimeBlocks.every(day => {
    const retained = current.datedTimeBlocks.find(row => row.date === day.date);
    return !retained || (retained.globalOccurrenceId === day.globalOccurrenceId &&
      (day.source === 'core_baseline' || (retained.source === day.source && sameScheduleBlocks(day.timeBlocks, retained.timeBlocks))) &&
      day.cities.filter(city => city.isOverride || city.publishedSnapshot).every(city => {
        const next = retained.cities.find(row => row.editionId === city.editionId);
        return next !== undefined && next.isOverride === city.isOverride && next.publishedSnapshot === city.publishedSnapshot &&
          sameScheduleBlocks(next.timeBlocks, city.timeBlocks);
      }));
  });
}
