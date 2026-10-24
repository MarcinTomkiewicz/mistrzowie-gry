import { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';

import type { GlobalTimeBlockInput } from '../interfaces/i-admin-global-event';
import { formatTimeLabel, parseTimeLabelToMinutes } from '../utils/time-format';
import { integerValidator, timeFormatValidator } from '../validators/form-value.validator';
import { requiredTrimmedValidator } from '../validators/required-trimmed.validator';

export function createEventGlobalTimeBlockForm(block?: GlobalTimeBlockInput) {
  const requiredText = [Validators.required, requiredTrimmedValidator()];
  const dayOffset = [Validators.required, integerValidator(), Validators.min(0), Validators.max(7)];
  return new FormGroup({
    label: new FormControl(block?.label ?? '', { nonNullable: true, validators: [...requiredText, Validators.maxLength(140)] }),
    startTime: new FormControl(formatTimeLabel(block?.startTime), { nonNullable: true, validators: [...requiredText, timeFormatValidator()] }),
    endTime: new FormControl(formatTimeLabel(block?.endTime), { nonNullable: true, validators: [...requiredText, timeFormatValidator()] }),
    startDayOffset: new FormControl(block?.startDayOffset ?? 0, { nonNullable: true, validators: dayOffset }),
    endDayOffset: new FormControl(block?.endDayOffset ?? 0, { nonNullable: true, validators: dayOffset }),
    requiredGmCount: new FormControl(block?.requiredGmCount ?? 1, { nonNullable: true,
      validators: [Validators.required, integerValidator(), Validators.min(1), Validators.max(2147483647)] }),
  }, { validators: blockRangeValidator });
}

export type EventGlobalTimeBlockForm = ReturnType<typeof createEventGlobalTimeBlockForm>;
export type EventGlobalTimeBlocksForm = FormArray<EventGlobalTimeBlockForm>;

export function createEventGlobalTimeBlocksForm(blocks?: readonly GlobalTimeBlockInput[]): EventGlobalTimeBlocksForm {
  return new FormArray(blocks === undefined ? [createEventGlobalTimeBlockForm()]
    : [...blocks].sort((a, b) => a.position - b.position).map(createEventGlobalTimeBlockForm),
  { validators: Validators.required });
}

export function mapEventGlobalTimeBlocks(form: EventGlobalTimeBlocksForm): GlobalTimeBlockInput[] {
  return form.controls.map((group, index) => {
    const block = group.getRawValue();
    const { startTime, endTime } = group.controls;
    // Preserve canonical offsets until the original hours change.
    const hoursChanged = startTime.value !== startTime.defaultValue || endTime.value !== endTime.defaultValue;
    const offsets = hoursChanged && parseTimeLabelToMinutes(block.startTime) !== null
      && parseTimeLabelToMinutes(block.endTime) !== null
      ? { startDayOffset: 0, endDayOffset: block.endTime < block.startTime ? 1 : 0 }
      : {};
    return { ...block, ...offsets, label: block.label.trim(), position: index + 1 };
  });
}

function blockRangeValidator(control: AbstractControl): ValidationErrors | null {
  const start = parseTimeLabelToMinutes(control.get('startTime')?.value);
  const end = parseTimeLabelToMinutes(control.get('endTime')?.value);
  return start !== null && end !== null && start === end ? { timeRange: true } : null;
}
