import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { normalizeText } from '../utils/normalize-text';

export function requiredTrimmedValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    return normalizeText(control.value) ? null : { requiredTrimmed: true };
  };
}