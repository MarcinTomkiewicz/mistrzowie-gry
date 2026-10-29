import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

import { isValidIsoDate } from '../utils/date';
import { MAX_GLOBAL_EVENT_DATES } from '../configs/events.config';
import { getEventDateRangeLength } from '../utils/event-schedule';
import { normalizeText } from '../utils/normalize-text';
import { timeRangeValidator } from './form-value.validator';

const MONTHLY_NTH_VALUES = [1, 2, 3, 4, -1];

export function eventMonthlyWeekdayRuleValidator(control: AbstractControl, globalCalendar = false): ValidationErrors | null {
  const monthlyNth = control.get('monthlyNth')?.value;
  const monthlyWeekday = control.get('monthlyWeekday')?.value;
  const errors: ValidationErrors = {};
  if (!MONTHLY_NTH_VALUES.includes(monthlyNth) && !(globalCalendar && monthlyNth === 5)) errors['monthlyNth'] = true;
  if (!Number.isInteger(monthlyWeekday) || monthlyWeekday < 0 || monthlyWeekday > 6) errors['monthlyWeekday'] = true;
  return Object.keys(errors).length ? errors : null;
}

export const eventTimeRangeValidator: ValidatorFn = timeRangeValidator(
  'startTime',
  'endTime',
  'timeRange',
);

export function eventScheduleValidator(
  control: AbstractControl,
  globalCalendar = false,
): ValidationErrors | null {
  const kind = control.get('kind')?.value;

  if (kind === 'single') {
    return isValidIsoDate(control.get('date')?.value)
      ? null
      : { singleDate: true };
  }

  if (kind === 'exact_dates') {
    const dates: unknown = control.get('dates')?.getRawValue();
    if (!Array.isArray(dates) || dates.length === 0) {
      return { exactDatesRequired: true };
    }
    if (!dates.every((date: unknown) => isValidIsoDate(date) && date.length === 10)) {
      return { exactDatesInvalid: true };
    }
    return new Set(dates).size === dates.length
      ? null
      : { exactDatesDuplicate: true };
  }

  if (kind !== 'recurring' && kind !== 'range') {
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

  if (kind === 'range') {
    if (!Object.keys(errors).length && (getEventDateRangeLength(startDate, endDate) ?? 0) > MAX_GLOBAL_EVENT_DATES) {
      errors['dateRangeLength'] = true;
    }
    return Object.keys(errors).length ? errors : null;
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
      Object.assign(errors, eventMonthlyWeekdayRuleValidator(control, globalCalendar));
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
}

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
