import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

import { isValidIsoDate } from '../utils/date';
import { normalizeText } from '../utils/normalize-text';
import { timeRangeValidator } from './form-value.validator';

const MONTHLY_NTH_VALUES = [1, 2, 3, 4, -1];

export const eventTimeRangeValidator: ValidatorFn = timeRangeValidator(
  'startTime',
  'endTime',
  'timeRange',
);

export const eventScheduleValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const kind = control.get('kind')?.value;

  if (kind === 'single') {
    return isValidIsoDate(control.get('date')?.value)
      ? null
      : { singleDate: true };
  }

  if (kind !== 'recurring') {
    return { scheduleKind: true };
  }

  const errors: ValidationErrors = {};
  const startDate = control.get('startDate')?.value;
  const endDate = control.get('endDate')?.value;
  const recurrenceKind = control.get('recurrenceKind')?.value;

  if (!isValidIsoDate(startDate) || !isValidIsoDate(endDate)) {
    errors['recurrenceDates'] = true;
  } else if (endDate < startDate) {
    errors['recurrenceDateRange'] = true;
  }

  switch (recurrenceKind) {
    case 'WEEKLY': {
      const byweekday = control.get('byweekday')?.value;

      if (
        !Array.isArray(byweekday) ||
        !byweekday.length ||
        byweekday.some(
          (weekday) =>
            !Number.isInteger(weekday) || weekday < 0 || weekday > 6,
        )
      ) {
        errors['weeklyDays'] = true;
      }
      break;
    }
    case 'MONTHLY_NTH_WEEKDAY': {
      const monthlyNth = control.get('monthlyNth')?.value;
      const monthlyWeekday = control.get('monthlyWeekday')?.value;

      if (!MONTHLY_NTH_VALUES.includes(monthlyNth)) {
        errors['monthlyNth'] = true;
      }
      if (
        !Number.isInteger(monthlyWeekday) ||
        monthlyWeekday < 0 ||
        monthlyWeekday > 6
      ) {
        errors['monthlyWeekday'] = true;
      }
      break;
    }
    case 'MONTHLY_DAY_OF_MONTH': {
      const dayOfMonth = control.get('dayOfMonth')?.value;

      if (
        !Number.isInteger(dayOfMonth) ||
        dayOfMonth < 1 ||
        dayOfMonth > 31
      ) {
        errors['dayOfMonth'] = true;
      }
      break;
    }
    default:
      errors['recurrenceKind'] = true;
  }

  return Object.keys(errors).length ? errors : null;
};

export function isoDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = normalizeText(control.value);

    return !value || isValidIsoDate(value) ? null : { isoDate: true };
  };
}

export function storagePathValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = normalizeText(control.value);

    if (!value) {
      return null;
    }

    return /^[a-z][a-z\d+.-]*:/i.test(value) || value.startsWith('//')
      ? { publicUrl: true }
      : null;
  };
}
