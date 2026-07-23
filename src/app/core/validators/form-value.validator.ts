import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { timeZoneDateToTimestamp } from '../utils/time-zone';

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

export function futureDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (value === null || !isValidDate(value)) {
      return null;
    }

    return value.getTime() > Date.now() ? null : { futureDate: true };
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

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}
