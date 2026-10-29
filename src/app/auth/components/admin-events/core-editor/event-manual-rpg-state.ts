import type { Signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { EventOccurrenceStatus } from '../../../../core/enums/event';
import type { AdminEventTimeline, ManualTimelineRow } from '../../../../core/interfaces/i-admin-event-timeline';
import type { AdminGlobalCalendarResult, GlobalTimeBlockInput } from '../../../../core/interfaces/i-admin-global-event';
import type { IAdminEventDetail, IAdminOccurrenceListItem, IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import type { ManualRpgSlotPayload } from '../../../../core/interfaces/i-event-program-item';
import type { SessionSourceKind } from '../../../../core/types/session-source';
import { assertEdgeContract } from '../../../../core/utils/edge-contract';
import { formatTimeLabel, parseTimeLabelToMinutes } from '../../../../core/utils/time-format';
import { integerValidator, timeFormatValidator } from '../../../../core/validators/form-value.validator';
import { requiredTrimmedValidator } from '../../../../core/validators/required-trimmed.validator';

export interface ManualRpgContext {
  core: IEventCoreDetail;
  edition: IAdminEventDetail;
  occurrence: IAdminOccurrenceListItem;
  calendar: AdminGlobalCalendarResult;
  timeline: Signal<AdminEventTimeline | null>;
}

export function manualRpgBlocks(context: ManualRpgContext): GlobalTimeBlockInput[] {
  const day = context.calendar.datedTimeBlocks.find(day => day.date === context.occurrence.date);
  return day?.cities.find(city => city.editionId === context.edition.id)?.timeBlocks ?? [];
}

export function canAddManualRpg(context: ManualRpgContext): boolean {
  const { core, edition, occurrence, calendar } = context;
  const timeline = context.timeline();
  const day = calendar.globalDates.find(day => day.date === occurrence.date && day.status === 'scheduled');
  const city = day?.cityOccurrences.find(city => city.editionId === edition.id && city.occurrenceId === occurrence.id);
  const blocks = calendar.datedTimeBlocks.find(day => day.date === occurrence.date);
  const local = blocks?.cities.find(city => city.editionId === edition.id);
  return calendar.coreId === core.id && calendar.calendarLifecycle === 'global' &&
    edition.eventCoreId === core.id && !!timeline && timeline.eventCoreId === core.id && timeline.eventId === edition.id &&
    !core.isActive && !core.hasPublicPage && !edition.isActive && !edition.currentlyPublic && !edition.isStaffingConverted &&
    occurrence.status === EventOccurrenceStatus.Planned && !occurrence.publishedAt && occurrence.activeParticipantCount === 0 &&
    !!city && city.decision === 'included' && !city.protected && !city.publishedAt && !city.unlinkedSameDate &&
    timeline.occurrences.some(row => row.occurrenceId === occurrence.id && row.date === occurrence.date &&
      row.status === EventOccurrenceStatus.Planned && row.participantSignupOpenedAt === null &&
      row.rows.every(item => item.frozen !== true && item.activeBookings === 0 && item.programStatus !== 'published')) &&
    blocks?.source !== 'published_snapshot' && !!local && !local.publishedSnapshot && local.timeBlocks.length > 0 && calendar.pendingDraft === null;
}

export function createManualRpgForm() {
  const integer = [Validators.required, integerValidator(), Validators.min(1)];
  const offset = [Validators.required, integerValidator(), Validators.min(0), Validators.max(7)];
  return new FormGroup({
    gmUserId: new FormControl('', { nonNullable: true, validators: Validators.required }),
    sessionKind: new FormControl<SessionSourceKind>('template', { nonNullable: true, validators: Validators.required }),
    sessionId: new FormControl('', { nonNullable: true, validators: Validators.required }),
    blockPosition: new FormControl<number | null>(null, Validators.required),
    label: new FormControl('', { nonNullable: true, validators: [Validators.required, requiredTrimmedValidator(), Validators.maxLength(140)] }),
    position: new FormControl(1, { nonNullable: true, validators: integer }),
    startTime: new FormControl('', { nonNullable: true, validators: [Validators.required, timeFormatValidator()] }),
    endTime: new FormControl('', { nonNullable: true, validators: [Validators.required, timeFormatValidator()] }),
    startDayOffset: new FormControl(0, { nonNullable: true, validators: offset }),
    endDayOffset: new FormControl(0, { nonNullable: true, validators: offset }),
    playerCapacityOverride: new FormControl<number | null>(null, [integerValidator(), Validators.min(1)]),
  }, { validators: control => {
    const start = parseTimeLabelToMinutes(control.get('startTime')?.value);
    const end = parseTimeLabelToMinutes(control.get('endTime')?.value);
    const from: unknown = control.get('startDayOffset')?.value;
    const to: unknown = control.get('endDayOffset')?.value;
    return start !== null && end !== null && typeof from === 'number' && typeof to === 'number' &&
      to * 1440 + end <= from * 1440 + start ? { timeRange: true } : null;
  } });
}

export function mapManualRpgSlot(form: ReturnType<typeof createManualRpgForm>, context: ManualRpgContext): ManualRpgSlotPayload {
  const { blockPosition, ...value } = form.getRawValue();
  assertEdgeContract(manualRpgIntervalValid({ blockPosition, ...value }, manualRpgBlocks(context)),
    'manualRpgSlot.interval', 'an interval inside the selected effective city/date block');
  return { ...value, label: value.label.trim(), occurrenceId: context.occurrence.id };
}

export function manualRpgIntervalValid(value: Pick<ManualRpgSlotPayload, 'startTime' | 'endTime' | 'startDayOffset' | 'endDayOffset'> &
  { blockPosition: number | null }, blocks: GlobalTimeBlockInput[]): boolean {
  const start = parseTimeLabelToMinutes(value.startTime);
  const end = parseTimeLabelToMinutes(value.endTime);
  if (start === null || end === null) return false;
  const from = value.startDayOffset * 1440 + start;
  const to = value.endDayOffset * 1440 + end;
  const matching = blocks.filter(block => {
    const blockStart = parseTimeLabelToMinutes(formatTimeLabel(block.startTime));
    const blockEnd = parseTimeLabelToMinutes(formatTimeLabel(block.endTime));
    return blockStart !== null && blockEnd !== null && from >= block.startDayOffset * 1440 + blockStart &&
      to <= block.endDayOffset * 1440 + blockEnd;
  });
  return to > from && matching.length === 1 && matching[0].position === value.blockPosition;
}

export function matchesManualRpg(row: ManualTimelineRow, payload: ManualRpgSlotPayload): boolean {
  return row.activity === null && row.programItemId !== null && row.host?.userId === payload.gmUserId &&
    row.sourceKind === payload.sessionKind && row.sourceSessionId === payload.sessionId && row.slotLabel === payload.label &&
    row.position === payload.position && formatTimeLabel(row.startTime) === payload.startTime &&
    formatTimeLabel(row.endTime) === payload.endTime && row.startDayOffset === payload.startDayOffset &&
    row.endDayOffset === payload.endDayOffset && row.session?.playerCapacityOverride === payload.playerCapacityOverride;
}
