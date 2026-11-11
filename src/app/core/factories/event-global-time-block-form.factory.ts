import { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { merge } from 'rxjs';

import type { GlobalTimeBlockInput } from '../interfaces/i-admin-global-event';
import { HourOffsetValue } from '../types/hour-offset';
import { formatHourOffsetRangeLabel, getHourOffsetDuration } from '../utils/hour-offset';
import { formatTimeLabel, parseTimeLabelToMinutes } from '../utils/time-format';
import { integerValidator, timeFormatValidator } from '../validators/form-value.validator';
import { requiredTrimmedValidator } from '../validators/required-trimmed.validator';

export type EventGlobalTimeBlocksMode = 'default' | 'saved-base';

export function createEventGlobalTimeBlockForm(block?: GlobalTimeBlockInput, mode: EventGlobalTimeBlocksMode = 'default') {
  const requiredText = [Validators.required, requiredTrimmedValidator()];
  const dayOffset = [Validators.required, integerValidator(), Validators.min(0), Validators.max(7)];
  const form = new FormGroup({
    position: new FormControl(block?.position ?? 1, { nonNullable: true,
      validators: [Validators.required, integerValidator(), Validators.min(1)] }),
    label: new FormControl(block?.label ?? '', { nonNullable: true, validators: [...requiredText, Validators.maxLength(140)] }),
    startTime: new FormControl(formatTimeLabel(block?.startTime), { nonNullable: true, validators: [...requiredText, timeFormatValidator()] }),
    endTime: new FormControl(formatTimeLabel(block?.endTime), { nonNullable: true, validators: [...requiredText, timeFormatValidator()] }),
    startDayOffset: new FormControl(block?.startDayOffset ?? 0, { nonNullable: true, validators: dayOffset }),
    endDayOffset: new FormControl(block?.endDayOffset ?? 0, { nonNullable: true, validators: dayOffset }),
    requiredGmCount: new FormControl(block?.requiredGmCount ?? 1, { nonNullable: true,
      validators: [Validators.required, integerValidator(), Validators.min(mode === 'saved-base' ? 0 : 1),
        Validators.max(mode === 'saved-base' ? 32767 : 2147483647)] }),
  }, { validators: blockRangeValidator });
  const original = form.getRawValue();
  const originalStart = parseTimeLabelToMinutes(original.startTime);
  const originalEnd = parseTimeLabelToMinutes(original.endTime);
  const multiDay = originalStart !== null && originalEnd !== null && getHourOffsetDuration(
    original.startDayOffset * HourOffsetValue.DayTotalHours + originalStart / 60,
    original.endDayOffset * HourOffsetValue.DayTotalHours + originalEnd / 60,
  ) > HourOffsetValue.DayTotalHours;
  // The subscription belongs to this form only; changing other fields never rewrites saved days.
  merge(form.controls.startTime.valueChanges, form.controls.endTime.valueChanges).subscribe(() => {
    const { startTime, endTime, endDayOffset } = form.controls;
    const start = parseTimeLabelToMinutes(startTime.value);
    const end = parseTimeLabelToMinutes(endTime.value);
    if (start === null || end === null) return;
    const unchanged = startTime.value === original.startTime && endTime.value === original.endTime;
    const day = unchanged || multiDay ? original.endDayOffset : original.startDayOffset + (end < start ? 1 : 0);
    if (endDayOffset.value !== day) endDayOffset.setValue(day, { emitEvent: false });
  });
  return form;
}

export type EventGlobalTimeBlockForm = ReturnType<typeof createEventGlobalTimeBlockForm>;
export type EventGlobalTimeBlocksForm = FormArray<EventGlobalTimeBlockForm>;

export function createEventGlobalTimeBlocksForm(
  blocks?: readonly GlobalTimeBlockInput[], mode: EventGlobalTimeBlocksMode = 'default',
): EventGlobalTimeBlocksForm {
  return new FormArray(blocks === undefined ? [createEventGlobalTimeBlockForm(undefined, mode)]
    : [...blocks].sort((a, b) => a.position - b.position).map(block => createEventGlobalTimeBlockForm(block, mode)),
  { validators: Validators.required });
}

export function mapEventGlobalTimeBlocks(form: EventGlobalTimeBlocksForm, mode: EventGlobalTimeBlocksMode = 'default'): GlobalTimeBlockInput[] {
  return form.controls.map((group, index) => {
    const block = group.getRawValue();
    return { position: mode === 'saved-base' ? block.position : index + 1,
      label: block.label.trim(), requiredGmCount: block.requiredGmCount,
      startTime: block.startTime, endTime: block.endTime,
      startDayOffset: block.startDayOffset, endDayOffset: block.endDayOffset };
  });
}

export function formatEventGlobalTimeBlockRange(
  block: Pick<GlobalTimeBlockInput, 'startTime' | 'endTime' | 'startDayOffset' | 'endDayOffset'>,
): string {
  const start = parseTimeLabelToMinutes(formatTimeLabel(block.startTime));
  const end = parseTimeLabelToMinutes(formatTimeLabel(block.endTime));
  return start === null || end === null ? '' : formatHourOffsetRangeLabel(
    block.startDayOffset * HourOffsetValue.DayTotalHours + start / 60,
    block.endDayOffset * HourOffsetValue.DayTotalHours + end / 60,
  );
}

function blockRangeValidator(control: AbstractControl): ValidationErrors | null {
  const start = parseTimeLabelToMinutes(control.get('startTime')?.value);
  const end = parseTimeLabelToMinutes(control.get('endTime')?.value);
  const startDay: unknown = control.get('startDayOffset')?.value;
  const endDay: unknown = control.get('endDayOffset')?.value;
  return start !== null && end !== null && typeof startDay === 'number' && typeof endDay === 'number' &&
    getHourOffsetDuration(startDay * HourOffsetValue.DayTotalHours + start / 60,
      endDay * HourOffsetValue.DayTotalHours + end / 60) === 0 ? { timeRange: true } : null;
}
