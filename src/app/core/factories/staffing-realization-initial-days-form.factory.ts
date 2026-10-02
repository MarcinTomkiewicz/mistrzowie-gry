import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { CreateAdminStaffingRealizationDayInput } from '../interfaces/admin-staffing-realization';
import { StaffingRealizationInitialDaysForm } from '../types/staffing-realization-form';
import { addDays, compareDatesByDay, isValidDate, toIsoDate } from '../utils/date';
import { integerValidator } from '../validators/form-value.validator';

export function createStaffingRealizationInitialDaysForm(): StaffingRealizationInitialDaysForm {
  return new FormGroup({
    dateRange: new FormControl<(Date | null)[] | null>(null, {
      validators: [Validators.required, initialDateRangeValidator],
    }),
    requiredGmCount: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, integerValidator(), Validators.min(1)],
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
    value.every(isValidDate)
  );
}
