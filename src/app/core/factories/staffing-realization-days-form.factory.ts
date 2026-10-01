import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import {
  AdminStaffingRealizationDay,
  CreateAdminStaffingRealizationDayInput,
  SaveAdminStaffingRealizationDayInput,
} from '../interfaces/admin-staffing-realization';
import {
  StaffingRealizationDayForm,
  StaffingRealizationDaysForm,
  StaffingRealizationInitialDaysForm,
} from '../types/staffing-realization-form';
import {
  addDays,
  compareDatesByDay,
  parseIsoDate,
  toIsoDate,
} from '../utils/date';
import {
  integerValidator,
  validDateValidator,
} from '../validators/form-value.validator';

export function createStaffingRealizationInitialDaysForm(): StaffingRealizationInitialDaysForm {
  return new FormGroup({
    dateRange: new FormControl<(Date | null)[] | null>(null, {
      validators: [Validators.required, initialDateRangeValidator],
    }),
    requiredGmCount: new FormControl(1, {
      nonNullable: true,
      validators: [
        Validators.required,
        integerValidator(),
        Validators.min(1),
      ],
    }),
  });
}

export function mapStaffingRealizationInitialDaysFormToInput(
  form: StaffingRealizationInitialDaysForm,
): CreateAdminStaffingRealizationDayInput[] {
  const { dateRange, requiredGmCount } = form.getRawValue();

  if (
    !isCompleteDateRange(dateRange) ||
    compareDatesByDay(dateRange[0], dateRange[1]) > 0
  ) {
    throw new Error('[STAFFING_DAYS] Cannot map an invalid initial date range.');
  }

  const days: CreateAdminStaffingRealizationDayInput[] = [];

  for (
    let date = dateRange[0];
    compareDatesByDay(date, dateRange[1]) <= 0;
    date = addDays(date, 1)
  ) {
    days.push({ date: toIsoDate(date), requiredGmCount });
  }

  return days;
}

export function createStaffingRealizationDaysForm(): StaffingRealizationDaysForm {
  return new FormGroup({
    days: new FormArray([createStaffingRealizationDayForm()], {
      validators: [Validators.required, uniqueDayDatesValidator],
    }),
  });
}

export function createStaffingRealizationDayForm(
  day: AdminStaffingRealizationDay | null = null,
): StaffingRealizationDayForm {
  return new FormGroup({
    id: new FormControl(day?.id ?? null),
    date: new FormControl(parseIsoDate(day?.date), {
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
  });
}

export function populateStaffingRealizationDaysForm(
  form: StaffingRealizationDaysForm,
  days: readonly AdminStaffingRealizationDay[],
): void {
  const controls = days.length
    ? days.map((day) => createStaffingRealizationDayForm(day))
    : [createStaffingRealizationDayForm()];

  form.controls.days.clear({ emitEvent: false });
  controls.forEach((control) =>
    form.controls.days.push(control, { emitEvent: false }),
  );
  form.updateValueAndValidity({ emitEvent: false });
  form.markAsPristine();
  form.markAsUntouched();
}

export function mapStaffingRealizationDaysFormToInput(
  form: StaffingRealizationDaysForm,
): SaveAdminStaffingRealizationDayInput[] {
  return form.controls.days.controls.map((day) => {
    const value = day.getRawValue();

    if (!value.date) {
      throw new Error('[STAFFING_DAYS] Cannot map a day without a date.');
    }

    return {
      ...(value.id === null ? {} : { id: value.id }),
      date: toIsoDate(value.date),
      requiredGmCount: value.requiredGmCount,
    };
  });
}

function initialDateRangeValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const value = control.value;

  if (value === null) {
    return null;
  }

  return isCompleteDateRange(value) &&
    compareDatesByDay(value[0], value[1]) <= 0
    ? null
    : { dateRange: true };
}

function isCompleteDateRange(value: unknown): value is [Date, Date] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every(
      (date) => date instanceof Date && !Number.isNaN(date.getTime()),
    )
  );
}

function uniqueDayDatesValidator(
  control: AbstractControl,
): ValidationErrors | null {
  if (!(control instanceof FormArray)) {
    return null;
  }

  const dateValues = control.controls
    .map((day) => day.get('date')?.value)
    .filter(
      (date): date is Date =>
        date instanceof Date && !Number.isNaN(date.getTime()),
    )
    .map(toIsoDate);

  return new Set(dateValues).size === dateValues.length
    ? null
    : { duplicateDate: true };
}
