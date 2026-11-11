import type { AdminGlobalCalendarResult, EventDatedTimeBlocksCommand } from '../../../../core/interfaces/i-admin-global-event';
import { sameSchedule, sameScheduleBlocks } from './event-global-schedule-state';

export function matchesDatedBlocksReadback(before: AdminGlobalCalendarResult, current: AdminGlobalCalendarResult,
  command: EventDatedTimeBlocksCommand, revision: number | null): boolean {
  return current.coreId === command.coreId && current.coreKey === before.coreKey &&
    current.calendarLifecycle === 'global' && current.mainEditionId === before.mainEditionId &&
    current.calendarRevision === (revision ?? command.expectedCalendarRevision + 1) &&
    current.draftRevision === before.draftRevision && JSON.stringify(current.pendingDraft) === JSON.stringify(before.pendingDraft) &&
    JSON.stringify(current.cities) === JSON.stringify(before.cities) &&
    JSON.stringify(current.globalDates) === JSON.stringify(before.globalDates) &&
    sameSchedule(current.schedule, before.schedule) && sameScheduleBlocks(current.timeBlocks, before.timeBlocks) &&
    current.datedTimeBlocks.length === before.datedTimeBlocks.length && before.datedTimeBlocks.every(day => {
      const saved = current.datedTimeBlocks.find(row => row.globalOccurrenceId === day.globalOccurrenceId && row.date === day.date);
      if (!saved || saved.cities.length !== day.cities.length) return false;
      const change = command.dateTimeBlocks.find(row => row.date === day.date);
      const blocks = change ? change.timeBlocks ?? current.timeBlocks : day.timeBlocks;
      const source = change ? change.timeBlocks === null ? 'core_baseline' : 'date_specific' : day.source;
      return saved.source === source && sameScheduleBlocks(saved.timeBlocks, blocks) && day.cities.every(city => {
        const actual = saved.cities.find(row => row.editionId === city.editionId);
        const localChange = command.cityDateTimeBlocks.find(row => row.date === day.date && row.editionId === city.editionId);
        const override = localChange ? localChange.timeBlocks !== null : city.isOverride;
        const effective = localChange ? localChange.timeBlocks ?? blocks
          : city.isOverride || city.publishedSnapshot ? city.timeBlocks : blocks;
        return actual !== undefined && actual.city === city.city && actual.isOverride === override &&
          actual.publishedSnapshot === city.publishedSnapshot && sameScheduleBlocks(actual.timeBlocks, effective);
      });
    });
}
