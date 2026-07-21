import { AbstractControl } from '@angular/forms';

import { EdgeFunctionError } from '../types/edge-function-error';
import { CommonFormTranslations } from '../types/i18n/common';

export function setControlValue<T>(
  control: AbstractControl<T>,
  value: T,
  dirty = true,
): void {
  control.setValue(value);

  if (dirty) {
    control.markAsDirty();
  }

  control.markAsTouched();
}

export function setControlEnabled(
  control: AbstractControl,
  enabled: boolean,
): void {
  if (enabled) {
    control.enable({ emitEvent: false });
    return;
  }

  control.disable({ emitEvent: false });
}

export function resolveEdgeFormFieldError(
  control: AbstractControl<unknown>,
  fieldPath: string,
  error: EdgeFunctionError | null,
  copy: CommonFormTranslations,
  relatedInvalid = false,
): string | null {
  const serverError = error?.fieldErrors[fieldPath];
  if (serverError) return serverError;
  if (!control.touched || (!control.invalid && !relatedInvalid)) return null;

  return control.hasError('required') || control.hasError('requiredTrimmed')
    ? copy.required
    : copy.invalid;
}
