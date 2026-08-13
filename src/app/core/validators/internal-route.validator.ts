import type { AbstractControl, ValidationErrors } from '@angular/forms';

export function internalRouteValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const value: unknown = control.value;

  if (typeof value !== 'string' || !value.trim()) return null;

  return value.startsWith('/') && !value.startsWith('//')
    ? null
    : { internalRoute: true };
}
