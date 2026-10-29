import { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';

import type { GlobalTimeBlockInput } from '../interfaces/i-admin-global-event';
import { formatTimeLabel, parseTimeLabelToMinutes } from '../utils/time-format';
import { integerValidator, timeFormatValidator } from '../validators/form-value.validator';
import { requiredTrimmedValidator } from '../validators/required-trimmed.validator';

export type EventGlobalTimeBlocksMode = 'default' | 'saved-base';

export function createEventGlobalTimeBlockForm(block?: GlobalTimeBlockInput, mode: EventGlobalTimeBlocksMode = 'default') {
  const requiredText = [Validators.required, requiredTrimmedValidator()];
  const dayOffset = [Validators.required, integerValidator(), Validators.min(0), Validators.max(7)];
  return new FormGroup({
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
  }, { validators: mode === 'saved-base' ? explicitBlockRangeValidator : blockRangeValidator });
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
    const { startTime, endTime } = group.controls;
    // Preserve canonical offsets until the original hours change.
    const hoursChanged = startTime.value !== startTime.defaultValue || endTime.value !== endTime.defaultValue;
    const offsets = mode === 'default' && hoursChanged && parseTimeLabelToMinutes(block.startTime) !== null
      && parseTimeLabelToMinutes(block.endTime) !== null
      ? { startDayOffset: 0, endDayOffset: block.endTime < block.startTime ? 1 : 0 }
      : { startDayOffset: block.startDayOffset, endDayOffset: block.endDayOffset };
    return { position: mode === 'saved-base' ? block.position : index + 1,
      label: block.label.trim(), requiredGmCount: block.requiredGmCount,
      startTime: block.startTime, endTime: block.endTime, ...offsets };
  });
}

function explicitBlockRangeValidator(control: AbstractControl): ValidationErrors | null {
  const start = parseTimeLabelToMinutes(control.get('startTime')?.value);
  const end = parseTimeLabelToMinutes(control.get('endTime')?.value);
  const startDay: unknown = control.get('startDayOffset')?.value;
  const endDay: unknown = control.get('endDayOffset')?.value;
  return start !== null && end !== null && typeof startDay === 'number' && typeof endDay === 'number' &&
    endDay * 1440 + end <= startDay * 1440 + start ? { timeRange: true } : null;
}

function blockRangeValidator(control: AbstractControl): ValidationErrors | null {
  const start = parseTimeLabelToMinutes(control.get('startTime')?.value);
  const end = parseTimeLabelToMinutes(control.get('endTime')?.value);
  return start !== null && end !== null && start === end ? { timeRange: true } : null;
}
