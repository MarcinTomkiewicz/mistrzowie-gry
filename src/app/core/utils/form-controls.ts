import { AbstractControl, FormArray, FormControl } from '@angular/forms';

import { EdgeFunctionError } from '../types/edge-function-error';
import { CommonFormTranslations } from '../types/i18n/common';

type MovableFormArray<TControl extends AbstractControl> = Pick<
  FormArray<TControl>,
  'insert' | 'markAsDirty' | 'removeAt'
> & {
  readonly controls: TControl[];
};

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

export function moveFormArrayControl<TControl extends AbstractControl>(
  formArray: MovableFormArray<TControl>,
  fromIndex: number,
  toIndex: number,
): void {
  const control = formArray.controls[fromIndex];

  if (!control) {
    throw new RangeError(`FormArray control ${fromIndex} does not exist.`);
  }

  formArray.removeAt(fromIndex);
  formArray.insert(toIndex, control);
  formArray.markAsDirty();
}

export function moveFormControlArrayItem<TValue>(
  control: FormControl<TValue[]>,
  fromIndex: number,
  toIndex: number,
): void {
  const values = [...control.getRawValue()];
  const [value] = values.splice(fromIndex, 1);

  if (value === undefined) {
    throw new RangeError(`FormControl array item ${fromIndex} does not exist.`);
  }

  values.splice(toIndex, 0, value);
  control.setValue(values);
  control.markAsDirty();
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
