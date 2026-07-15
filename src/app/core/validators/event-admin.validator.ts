import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

import { normalizeText } from '../utils/normalize-text';
import { timeZoneDateToTimestamp } from '../utils/time';

const MONTHLY_NTH_VALUES = [1, 2, 3, 4, -1];
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export const eventTimeRangeValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const startTime = control.get('startTime')?.value;
  const endTime = control.get('endTime')?.value;

  if (!startTime || !endTime) {
    return null;
  }

  return TIME_PATTERN.test(startTime) &&
      TIME_PATTERN.test(endTime) &&
      endTime > startTime
    ? null
    : { timeRange: true };
};

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

export function integerValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    return value === null || value === '' || Number.isInteger(value)
      ? null
      : { integer: true };
  };
}

export function validDateValidator(
  getTimeZone?: () => string,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (value === null) {
      return null;
    }

    if (!isValidDate(value)) {
      return { validDate: true };
    }

    if (
      getTimeZone &&
      timeZoneDateToTimestamp(value, getTimeZone()) === null
    ) {
      return { validDate: true };
    }

    return null;
  };
}

export function dateTimeRangeValidator(
  startControlName: string,
  endControlName: string,
  errorKey: string,
  resolveTimestamp?: (
    date: Date,
    boundary: 'start' | 'end',
  ) => string | null,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const start = control.get(startControlName)?.value;
    const end = control.get(endControlName)?.value;

    if (!isValidDate(start) || !isValidDate(end)) {
      return null;
    }

    if (!resolveTimestamp) {
      return end.getTime() > start.getTime()
        ? null
        : { [errorKey]: true };
    }

    const startTimestamp = resolveTimestamp(start, 'start');
    const endTimestamp = resolveTimestamp(end, 'end');

    if (!startTimestamp || !endTimestamp) {
      return null;
    }

    return endTimestamp > startTimestamp
      ? null
      : { [errorKey]: true };
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

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}
