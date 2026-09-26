import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { isValidRichContentLinkHref } from '../domain/rich-content/rich-content-link-target';

export function richContentLinkHrefValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: unknown = control.value;
    return typeof value === 'string' && isValidRichContentLinkHref(value.trim())
      ? null : { richContentLink: true };
  };
}
