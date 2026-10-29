import type {
  AdminGlobalBaseTimeBlocksPreview, AdminGlobalBaseTimeBlocksSave, AdminGlobalCalendarResult,
  EventGlobalBaseTimeBlocksCommand,
} from '../../../../core/interfaces/i-admin-global-event';
import type { IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import { assertEdgeContract } from '../../../../core/utils/edge-contract';
import { sameSchedule, sameScheduleBlocks } from './event-global-schedule-state';

export interface GlobalBaseTimeBlocksCommand extends EventGlobalBaseTimeBlocksCommand {
  baseline: AdminGlobalCalendarResult;
  outcome: 'applied' | 'unchanged' | null;
}

export function assertBaseCalendar(core: IEventCoreDetail, calendar: AdminGlobalCalendarResult): void {
  assertEdgeContract(calendar.coreId === core.id && calendar.coreKey === core.key &&
    Number.isInteger(calendar.calendarRevision) && calendar.calendarRevision >= 0 &&
    Number.isInteger(calendar.draftRevision) && Array.isArray(calendar.timeBlocks) && calendar.timeBlocks.length > 0 &&
    calendar.timeBlocks.every(block => typeof block.blockId === 'string' && Number.isInteger(block.position) && block.position > 0) &&
    new Set(calendar.timeBlocks.map(block => block.position)).size === calendar.timeBlocks.length &&
    new Set(calendar.timeBlocks.map(block => block.blockId)).size === calendar.timeBlocks.length,
  'globalBaseTimeBlocks', 'the canonical calendar with unique block identities and numeric revisions');
}

export function canEditBaseTimeBlocks(core: IEventCoreDetail, calendar: AdminGlobalCalendarResult): boolean {
  return calendar.calendarLifecycle === 'global' && !core.isActive && !core.hasPublicPage && calendar.pendingDraft === null &&
    calendar.draftRevision === 0 && calendar.cities.every(city => !city.isActive) &&
    calendar.globalDates.every(day => day.cityOccurrences.every(city => !city.protected && !city.publishedAt &&
      !city.unlinkedSameDate && (city.occurrenceStatus === null || city.occurrenceStatus === 'planned'))) &&
    calendar.datedTimeBlocks.every(day => day.source !== 'published_snapshot' && day.cities.every(city => !city.publishedSnapshot));
}

export function assertBasePreview(preview: AdminGlobalBaseTimeBlocksPreview, command: EventGlobalBaseTimeBlocksCommand): void {
  assertEdgeContract(preview.applied === false && preview.published === false && preview.participantSignupOpened === false &&
    (preview.appliedToPublic === undefined || preview.appliedToPublic === false) &&
    Array.isArray(preview.fieldErrors) && Array.isArray(preview.blockers) &&
    ((preview.valid === true && (preview.status === 'preview_ready' || preview.status === 'unchanged')) ||
      (preview.valid === false && (preview.status === 'blocked' || preview.status === 'invalid'))) &&
    (preview.coreId === undefined || preview.coreId === command.coreId) &&
    (preview.calendarRevision === undefined || preview.calendarRevision === command.expectedCalendarRevision) &&
    (!preview.valid || preview.timeBlocks === undefined || sameScheduleBlocks(preview.timeBlocks, command.timeBlocks)) &&
    (preview.changed === undefined || typeof preview.changed === 'boolean'),
  'globalBaseTimeBlocksPreview', 'a read-only preview for the exact command and calendar revision');
}

export function assertBaseSave(saved: AdminGlobalBaseTimeBlocksSave, command: EventGlobalBaseTimeBlocksCommand): void {
  assertBasePreview(saved.preview, command);
  assertEdgeContract(saved.coreId === command.coreId && saved.published === false && saved.participantSignupOpened === false &&
    saved.appliedToPublic === false && saved.saved === saved.preview.valid &&
    ((saved.saved === true && (saved.status === 'applied' || saved.status === 'unchanged')) ||
      (saved.saved === false && (saved.status === 'blocked' || saved.status === 'invalid'))) &&
    (!saved.saved || saved.calendarRevision === undefined || (Number.isInteger(saved.calendarRevision) &&
      saved.calendarRevision === command.expectedCalendarRevision + (saved.status === 'applied' ? 1 : 0))) &&
    (!saved.saved || saved.timeBlocks === undefined || sameScheduleBlocks(saved.timeBlocks, command.timeBlocks)),
  'globalBaseTimeBlocksSave', 'an explicit applied, unchanged or refused result without publication');
}

export function matchesBaseTimeBlocks(calendar: AdminGlobalCalendarResult, command: GlobalBaseTimeBlocksCommand): boolean {
  const previous = command.baseline;
  return calendar.calendarRevision === command.expectedCalendarRevision + (command.outcome === 'unchanged' ? 0 : 1) &&
    calendar.calendarLifecycle === 'global' && calendar.coreKey === previous.coreKey && calendar.mainEditionId === previous.mainEditionId &&
    calendar.pendingDraft === null && calendar.draftRevision === previous.draftRevision &&
    sameScheduleBlocks(calendar.timeBlocks, command.timeBlocks) &&
    calendar.timeBlocks.length === previous.timeBlocks.length && previous.timeBlocks.every(block =>
      calendar.timeBlocks.some(next => next.position === block.position && next.blockId === block.blockId)) &&
    sameSchedule(calendar.schedule, previous.schedule) && sameCalendarDates(previous, calendar) && sameDatedOverrides(previous, calendar);
}

function sameCalendarDates(previous: AdminGlobalCalendarResult, current: AdminGlobalCalendarResult): boolean {
  const cities = (calendar: AdminGlobalCalendarResult): string => JSON.stringify([...calendar.cities]
    .sort((a, b) => a.editionId.localeCompare(b.editionId)).map(city => [city.editionId, city.city, city.slug, city.timezone,
      city.isMain, city.isActive, city.isDefaultPublicLegacy]));
  const dates = (calendar: AdminGlobalCalendarResult): string => JSON.stringify([...calendar.globalDates]
    .sort((a, b) => a.date.localeCompare(b.date)).map(day => [day.date, day.globalOccurrenceId, day.status,
      [...day.cityOccurrences].sort((a, b) => a.editionId.localeCompare(b.editionId)).map(city => [city.editionId, city.city,
        city.decision, city.occurrenceId, city.occurrenceStatus, city.publishedAt, city.protected, city.unlinkedSameDate])]));
  return cities(previous) === cities(current) && dates(previous) === dates(current);
}

function sameDatedOverrides(previous: AdminGlobalCalendarResult, current: AdminGlobalCalendarResult): boolean {
  return current.datedTimeBlocks.length === previous.datedTimeBlocks.length && previous.datedTimeBlocks.every(day => {
    const next = current.datedTimeBlocks.find(row => row.date === day.date);
    return next !== undefined && next.globalOccurrenceId === day.globalOccurrenceId && next.source === day.source &&
      sameScheduleBlocks(next.timeBlocks, day.source === 'core_baseline' ? current.timeBlocks : day.timeBlocks) &&
      next.cities.length === day.cities.length && day.cities.every(city => {
        const retained = next.cities.find(row => row.editionId === city.editionId);
        return retained !== undefined && retained.city === city.city && retained.isOverride === city.isOverride &&
          retained.publishedSnapshot === city.publishedSnapshot && sameScheduleBlocks(retained.timeBlocks,
            city.isOverride || city.publishedSnapshot ? city.timeBlocks : next.timeBlocks);
      });
  });
}
