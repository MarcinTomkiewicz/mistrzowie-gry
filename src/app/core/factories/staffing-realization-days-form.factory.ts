import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import {
  getNextStaffingDayDate,
  getStaffingSlotConflicts,
} from '../domain/staffing/schedule';
import {
  AdminStaffingSchedule,
  SaveAdminStaffingScheduleDayInput,
  SaveAdminStaffingScheduleSlotInput,
} from '../interfaces/admin-staffing-realization';
import {
  StaffingRealizationDayDraft,
  StaffingRealizationSlotDraft,
} from '../types/staffing-realization-editor-draft';
import {
  StaffingRealizationDayForm,
  StaffingRealizationDaysForm,
  StaffingRealizationSlotForm,
} from '../types/staffing-realization-form';
import { isValidDate, parseIsoDate, toIsoDate } from '../utils/date';
import { normalizeText } from '../utils/normalize-text';
import {
  integerValidator,
  timeFormatValidator,
  timeRangeValidator,
  validDateValidator,
} from '../validators/form-value.validator';
import { requiredTrimmedValidator } from '../validators/required-trimmed.validator';

export function createStaffingRealizationDaysForm(): StaffingRealizationDaysForm {
  return new FormGroup({
    days: new FormArray([createStaffingRealizationDayForm()], {
      validators: [Validators.required, uniqueDayDatesValidator],
    }),
  });
}

export function createStaffingRealizationDayForm(
  day: StaffingRealizationDayDraft | null = null,
): StaffingRealizationDayForm {
  return new FormGroup({
    id: new FormControl(day?.id ?? null),
    date: new FormControl(day?.date ?? null, {
      validators: [Validators.required, validDateValidator()],
    }),
    requiredGmCount: new FormControl(day?.requiredGmCount ?? 1, {
      nonNullable: true,
      validators: [
        Validators.required,
        integerValidator(),
        Validators.min(1),
      ],
    }),
    slots: new FormArray(
      (day?.slots ?? []).map((slot) =>
        createStaffingRealizationSlotForm(slot),
      ),
      { validators: [staffingSlotOverlapValidator] },
    ),
  });
}

export function createStaffingRealizationSlotForm(
  slot: StaffingRealizationSlotDraft | null = null,
): StaffingRealizationSlotForm {
  return new FormGroup(
    {
      id: new FormControl(slot?.id ?? null),
      label: new FormControl(slot?.label ?? '', {
        nonNullable: true,
        validators: [requiredTrimmedValidator()],
      }),
      startTime: new FormControl(slot?.startTime ?? '', {
        nonNullable: true,
        validators: [Validators.required, timeFormatValidator()],
      }),
      endTime: new FormControl(slot?.endTime ?? '', {
        nonNullable: true,
        validators: [Validators.required, timeFormatValidator()],
      }),
      position: new FormControl(slot?.position ?? 1, {
        nonNullable: true,
        validators: [integerValidator(), Validators.min(1)],
      }),
    },
    {
      validators: [
        timeRangeValidator('startTime', 'endTime', 'timeRange'),
      ],
    },
  );
}

export function mapStaffingRealizationScheduleToDraft(
  schedule: AdminStaffingSchedule,
): StaffingRealizationDayDraft[] {
  return schedule.days.map((day) => ({
    id: day.id,
    date: parseIsoDate(day.date),
    requiredGmCount: day.requiredGmCount,
    slots: day.slots.map(({ id, label, startTime, endTime, position }) => ({
      id, label, startTime, endTime, position,
    })),
  }));
}

export function populateStaffingRealizationDaysForm(
  form: StaffingRealizationDaysForm,
  days: readonly StaffingRealizationDayDraft[],
): void {
  const controls = days.map((day) =>
    createStaffingRealizationDayForm(day),
  );

  form.controls.days.clear({ emitEvent: false });
  controls.forEach((control) =>
    form.controls.days.push(control, { emitEvent: false }),
  );
  form.updateValueAndValidity({ emitEvent: false });
  form.markAsPristine();
  form.markAsUntouched();
}

export function addStaffingRealizationDay(
  days: FormArray<StaffingRealizationDayForm>,
): void {
  const day = createStaffingRealizationDayForm();
  day.controls.date.setValue(getNextStaffingDayDate(days.getRawValue()));
  days.push(day);
  days.markAsDirty();
}

export function addStaffingRealizationSlot(
  slots: FormArray<StaffingRealizationSlotForm>,
): void {
  slots.push(createStaffingRealizationSlotForm());
  resequenceSlots(slots);
}

export function swapStaffingRealizationSlotLabels(
  slots: FormArray<StaffingRealizationSlotForm>,
  fromIndex: number,
  toIndex: number,
): void {
  const sourceLabel = slots.at(fromIndex).controls.label;
  const targetLabel = slots.at(toIndex).controls.label;
  const label = sourceLabel.value;

  sourceLabel.setValue(targetLabel.value, { emitEvent: false });
  targetLabel.setValue(label, { emitEvent: false });
  slots.updateValueAndValidity();
  slots.markAsDirty();
}

export function copyStaffingRealizationSlot(
  slots: FormArray<StaffingRealizationSlotForm>,
  index: number,
): void {
  const { label, startTime, endTime } = slots.at(index).getRawValue();
  const copiedSlot = createStaffingRealizationSlotForm();
  copiedSlot.patchValue({ label, startTime, endTime }, { emitEvent: false });
  slots.insert(index + 1, copiedSlot, { emitEvent: false });
  resequenceSlots(slots);
}

export function removeStaffingRealizationSlot(
  slots: FormArray<StaffingRealizationSlotForm>,
  index: number,
): void {
  slots.removeAt(index);
  resequenceSlots(slots);
}

function mapStaffingRealizationSlotsFormToInput(
  slots: FormArray<StaffingRealizationSlotForm>,
): SaveAdminStaffingScheduleSlotInput[] {
  return slots.controls.map((slot) => {
    const value = slot.getRawValue();
    const label = normalizeText(value.label);

    if (!label) {
      throw new Error('[STAFFING_SCHEDULE] Cannot map a slot without a label.');
    }

    return {
      ...(value.id === null ? {} : { id: value.id }),
      label,
      startTime: value.startTime,
      endTime: value.endTime,
      position: value.position,
    };
  });
}

export function mapStaffingRealizationDaysFormToInput(
  form: StaffingRealizationDaysForm,
): SaveAdminStaffingScheduleDayInput[] {
  return form.controls.days.controls.map((day) => {
    const value = day.getRawValue();

    if (!value.date) {
      throw new Error('[STAFFING_DAYS] Cannot map a day without a date.');
    }

    return {
      ...(value.id === null ? {} : { id: value.id }),
      date: toIsoDate(value.date),
      requiredGmCount: value.requiredGmCount,
      slots: mapStaffingRealizationSlotsFormToInput(day.controls.slots),
    };
  });
}

function resequenceSlots(slots: FormArray<StaffingRealizationSlotForm>): void {
  slots.controls.forEach((slot, index) =>
    slot.controls.position.setValue((index + 1) * 10, {
      emitEvent: false,
    }),
  );
  slots.updateValueAndValidity();
  slots.markAsDirty();
}

function uniqueDayDatesValidator(
  control: AbstractControl,
): ValidationErrors | null {
  if (!(control instanceof FormArray)) {
    return null;
  }

  const dateValues = control.controls
    .map((day) => day.get('date')?.value)
    .filter(isValidDate)
    .map(toIsoDate);

  return new Set(dateValues).size === dateValues.length
    ? null
    : { duplicateDate: true };
}

function staffingSlotOverlapValidator(
  control: AbstractControl,
): ValidationErrors | null {
  if (!(control instanceof FormArray)) {
    return null;
  }

  return getStaffingSlotConflicts(control.getRawValue()).count
    ? { slotOverlap: true }
    : null;
}
