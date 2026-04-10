import { AbstractControl } from '@angular/forms';

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
