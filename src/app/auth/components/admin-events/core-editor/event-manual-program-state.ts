import type { Signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';

import { EventOccurrenceStatus } from '../../../../core/enums/event';
import type { AdminEventTimeline, TimelineRow } from '../../../../core/interfaces/i-admin-event-timeline';
import type { AdminGlobalCalendarResult, GlobalTimeBlockInput } from '../../../../core/interfaces/i-admin-global-event';
import type { IAdminEventDetail, IAdminOccurrenceListItem, IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import type { AdminEventActivityKind, AdminEventActivityKinds, ManualActivityPayload, ManualActivityResult } from '../../../../core/interfaces/i-admin-event-activity';
import type { ManualRpgSlotPayload, ManualRpgSlotResult } from '../../../../core/interfaces/i-event-program-item';
import type { SessionSourceKind } from '../../../../core/types/session-source';
import { assertEdgeContract, readEdgeArray, readEdgeBoolean, readEdgeObject, readEdgeString, readEdgeUuid } from '../../../../core/utils/edge-contract';
import { normalizeText } from '../../../../core/utils/normalize-text';
import { formatTimeLabel, parseTimeLabelToMinutes } from '../../../../core/utils/time-format';
import { integerValidator, timeFormatValidator } from '../../../../core/validators/form-value.validator';
import { requiredTrimmedValidator } from '../../../../core/validators/required-trimmed.validator';

export type ManualProgramKind = 'rpg' | 'activity';
export interface ManualProgramContext {
  core: IEventCoreDetail;
  edition: IAdminEventDetail;
  occurrence: IAdminOccurrenceListItem;
  calendar: AdminGlobalCalendarResult;
  timeline: Signal<AdminEventTimeline | null>;
}
export interface ManualProgramTarget { coreId: string; editionId: string; occurrenceId: string; date: string }
export type ManualProgramCommand = ManualProgramTarget & { blockPosition: number } & (
  | { kind: 'rpg'; payload: ManualRpgSlotPayload }
  | { kind: 'activity'; payload: ManualActivityPayload }
);
export type ConfirmedManualProgramCommand =
  | (Extract<ManualProgramCommand, { kind: 'rpg' }> & { confirmation: ManualRpgSlotResult })
  | (Extract<ManualProgramCommand, { kind: 'activity' }> & { confirmation: ManualActivityResult });

export function manualProgramBlocks(context: ManualProgramContext): GlobalTimeBlockInput[] {
  const day = context.calendar.datedTimeBlocks.find(day => day.date === context.occurrence.date);
  return day?.cities.find(city => city.editionId === context.edition.id)?.timeBlocks ?? [];
}

export function canAddManualProgram(context: ManualProgramContext): boolean {
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

function createPlacementControls() {
  const offset = [Validators.required, integerValidator(), Validators.min(0), Validators.max(7)];
  return {
    blockPosition: new FormControl<number | null>(null, Validators.required),
    position: new FormControl(1, { nonNullable: true, validators: [Validators.required, integerValidator(), Validators.min(1)] }),
    startTime: new FormControl('', { nonNullable: true, validators: [Validators.required, timeFormatValidator()] }),
    endTime: new FormControl('', { nonNullable: true, validators: [Validators.required, timeFormatValidator()] }),
    startDayOffset: new FormControl(0, { nonNullable: true, validators: offset }),
    endDayOffset: new FormControl(0, { nonNullable: true, validators: offset }),
  };
}
function createCapacityControl() { return new FormControl<number | null>(null, [integerValidator(), Validators.min(1)]); }

export function createManualRpgForm() {
  return new FormGroup({
    ...createPlacementControls(),
    gmUserId: new FormControl('', { nonNullable: true, validators: Validators.required }),
    sessionKind: new FormControl<SessionSourceKind>('template', { nonNullable: true, validators: Validators.required }),
    sessionId: new FormControl('', { nonNullable: true, validators: Validators.required }),
    label: new FormControl('', { nonNullable: true, validators: [Validators.required, requiredTrimmedValidator(), Validators.maxLength(140)] }),
    playerCapacityOverride: createCapacityControl(),
  }, { validators: placementRangeValidator });
}

export function createManualActivityForm() {
  return new FormGroup({
    ...createPlacementControls(),
    kindKey: new FormControl('', { nonNullable: true, validators: Validators.required }),
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, requiredTrimmedValidator(), Validators.maxLength(140)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required, requiredTrimmedValidator(), Validators.maxLength(12000)] }),
    presenter: new FormControl('', { nonNullable: true, validators: Validators.maxLength(140) }),
    attendeeCapacity: createCapacityControl(),
  }, { validators: placementRangeValidator });
}

type PlacementValue = Pick<ManualRpgSlotPayload, 'position' | 'startTime' | 'endTime' | 'startDayOffset' | 'endDayOffset'> & { blockPosition: number | null };

export function manualProgramIntervalValid(value: PlacementValue, blocks: GlobalTimeBlockInput[]): boolean {
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

function placementRangeValidator(control: AbstractControl) {
  const start = parseTimeLabelToMinutes(control.get('startTime')?.value);
  const end = parseTimeLabelToMinutes(control.get('endTime')?.value);
  const from: unknown = control.get('startDayOffset')?.value;
  const to: unknown = control.get('endDayOffset')?.value;
  return start !== null && end !== null && typeof from === 'number' && typeof to === 'number' &&
    to * 1440 + end <= from * 1440 + start ? { timeRange: true } : null;
}

function mapPlacement(value: PlacementValue, context: ManualProgramContext) {
  assertEdgeContract(manualProgramIntervalValid(value, manualProgramBlocks(context)),
    'manualProgram.interval', 'an interval inside exactly one selected effective city/date block');
  const { position, startTime, endTime, startDayOffset, endDayOffset } = value;
  return { occurrenceId: context.occurrence.id, position, startTime, endTime, startDayOffset, endDayOffset };
}

export function mapManualRpgSlot(form: ReturnType<typeof createManualRpgForm>, context: ManualProgramContext): ManualRpgSlotPayload {
  const value = form.getRawValue();
  return { ...mapPlacement(value, context), label: value.label.trim(), gmUserId: value.gmUserId, sessionKind: value.sessionKind,
    sessionId: value.sessionId, playerCapacityOverride: value.playerCapacityOverride };
}

export function mapManualActivity(form: ReturnType<typeof createManualActivityForm>, context: ManualProgramContext): ManualActivityPayload {
  const value = form.getRawValue();
  return { ...mapPlacement(value, context), kindKey: value.kindKey, title: value.title.trim(), description: value.description.trim(),
    presenter: normalizeText(value.presenter), attendeeCapacity: value.attendeeCapacity };
}

export function readActiveActivityKinds(value: AdminEventActivityKinds): AdminEventActivityKind[] {
  const source = readEdgeObject(value, 'activityKinds');
  assertKeys(source, ['kinds'], 'activityKinds');
  return readEdgeArray(source['kinds'], 'activityKinds.kinds').map(value => {
    const item = readEdgeObject(value, 'activityKind');
    assertKeys(item, ['key', 'label', 'isActive'], 'activityKind');
    return { key: readEdgeString(item['key'], 'activityKind.key'), label: readEdgeString(item['label'], 'activityKind.label'),
      isActive: readEdgeBoolean(item['isActive'], 'activityKind.isActive') };
  }).filter(kind => kind.isActive);
}

export function assertManualRpgSave(result: ManualRpgSlotResult): void {
  const value = readEdgeObject(result, 'manualRpgSave');
  readEdgeUuid(value['programItemId'], 'manualRpgSave.programItemId');
  assertEdgeContract(value['status'] === 'pending' && (value['effectivePlayerCapacity'] === null ||
    (typeof value['effectivePlayerCapacity'] === 'number' && Number.isInteger(value['effectivePlayerCapacity']) && value['effectivePlayerCapacity'] > 0)),
  'manualRpgSave', 'an unpublished program item and its effective capacity');
}

export function assertManualActivitySave(result: ManualActivityResult, command: Extract<ManualProgramCommand, { kind: 'activity' }>): void {
  const value = readEdgeObject(result, 'manualActivitySave');
  assertKeys(value, ['saved', 'slotId', 'occurrenceId', 'kindKey', 'status', 'title', 'description', 'presenter', 'attendeeCapacity',
    'blockPosition', 'participantSignupSupported'], 'manualActivitySave');
  readEdgeUuid(value['slotId'], 'manualActivitySave.slotId');
  const payload = command.payload;
  assertEdgeContract(result.saved === true && result.occurrenceId === payload.occurrenceId && result.kindKey === payload.kindKey &&
    result.status === 'approved' && result.title === payload.title && result.description === payload.description &&
    result.presenter === (payload.presenter ?? null) && result.attendeeCapacity === (payload.attendeeCapacity ?? null) &&
    result.blockPosition === command.blockPosition && result.participantSignupSupported === false,
  'manualActivitySave', 'the approved activity with the submitted values and derived effective block');
}

export function matchesConfirmedManualProgram(row: TimelineRow, command: ConfirmedManualProgramCommand): boolean {
  const { payload } = command;
  if (row.source !== 'manual' || row.position !== payload.position || row.blockPosition !== command.blockPosition ||
    formatTimeLabel(row.startTime) !== payload.startTime || formatTimeLabel(row.endTime) !== payload.endTime ||
    row.startDayOffset !== payload.startDayOffset || row.endDayOffset !== payload.endDayOffset || row.status !== 'pending') return false;
  if (command.kind === 'rpg') {
    return row.programItemId === command.confirmation.programItemId && row.activity === null &&
      row.host?.userId === command.payload.gmUserId && row.sourceKind === command.payload.sessionKind &&
      row.sourceSessionId === command.payload.sessionId && row.slotLabel === command.payload.label &&
      row.session?.playerCapacityOverride === command.payload.playerCapacityOverride &&
      row.session?.effectiveCapacity === command.confirmation.effectivePlayerCapacity;
  }
  const activity = row.activity;
  return row.slotId === command.confirmation.slotId && activity !== null && row.host === null && row.session === null &&
    row.programItemId === null && row.sourceKind === null && row.sourceSessionId === null && row.programStatus === 'approved' &&
    row.participantSignupSupported === false && activity.status === 'approved' && activity.participantSignupSupported === false &&
    activity.kindKey === command.payload.kindKey && activity.title === command.payload.title &&
    activity.description === command.payload.description && activity.presenter === command.confirmation.presenter &&
    activity.attendeeCapacity === command.confirmation.attendeeCapacity;
}

function assertKeys(value: Readonly<Record<string, unknown>>, keys: string[], path: string): void {
  assertEdgeContract(Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key)), path, 'the exact frozen keys');
}
