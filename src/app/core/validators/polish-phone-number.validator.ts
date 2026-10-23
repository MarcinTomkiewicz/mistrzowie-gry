import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { normalizePolishPhoneNumber } from '../utils/phone';

export function polishPhoneNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: unknown = control.value;
    if (value === null || value === undefined || value === '') return null;

    return normalizePolishPhoneNumber(value) !== null ? null : { polishPhoneNumber: true };
  };
}
