import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import type {
  CommercialConstantAdminItem,
  CommercialConstantSavePayload,
  CommercialConstantValueType,
} from '../types/commercial-constant-admin';
import type {
  CommercialConstantDurationUnit,
  CommercialConstantEditorForm,
} from '../types/commercial-constant-editor-form';
import { setControlEnabled } from '../utils/form-controls';
import { integerValidator } from '../validators/form-value.validator';
import { requiredTrimmedValidator } from '../validators/required-trimmed.validator';

const TOKEN_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const NESTED_TOKEN_PATTERN = /\[[a-z][a-z0-9]*(-[a-z0-9]+)*\]/;
const requiredTextValidators = [
  Validators.required,
  requiredTrimmedValidator(),
];

export function createCommercialConstantEditorForm(
): CommercialConstantEditorForm {
  const form = new FormGroup({
    token: new FormControl('', {
      nonNullable: true,
      validators: [...requiredTextValidators, Validators.pattern(TOKEN_PATTERN)],
    }),
    label: new FormControl('', {
      nonNullable: true,
      validators: requiredTextValidators,
    }),
    valueType: new FormControl<CommercialConstantValueType>('duration', {
      nonNullable: true,
    }),
    numericValue: new FormControl<number | null>(null),
    textValue: new FormControl('', { nonNullable: true }),
    durationUnit: new FormControl<CommercialConstantDurationUnit>('minutes', {
      nonNullable: true,
    }),
  });

  syncCommercialConstantValueValidators(form);
  return form;
}

export function resetCommercialConstantEditorForm(
  form: CommercialConstantEditorForm,
  constant: CommercialConstantAdminItem | null,
): void {
  const durationUnit = getInitialDurationUnit(constant);

  form.reset(
    {
      token: constant?.token ?? '',
      label: constant?.label ?? '',
      valueType: constant?.valueType ?? 'duration',
      numericValue: getInitialNumericValue(constant, durationUnit),
      textValue: constant?.valueType === 'text' ? constant.draftValue : '',
      durationUnit,
    },
    { emitEvent: false },
  );

  setControlEnabled(form.controls.token, constant?.canChangeIdentity ?? true);
  setControlEnabled(
    form.controls.valueType,
    constant?.canChangeIdentity ?? true,
  );
  syncCommercialConstantValueValidators(form);
  form.markAsPristine();
  form.markAsUntouched();
}

export function changeCommercialConstantValueType(
  form: CommercialConstantEditorForm,
): void {
  form.controls.numericValue.reset(null);
  form.controls.textValue.reset('');
  form.controls.durationUnit.setValue('minutes');
  syncCommercialConstantValueValidators(form);
}

export function changeCommercialConstantDurationUnit(
  form: CommercialConstantEditorForm,
  unit: CommercialConstantDurationUnit,
): void {
  const currentUnit = form.controls.durationUnit.value;
  const currentValue = form.controls.numericValue.value;

  if (currentUnit === unit) {
    return;
  }

  form.controls.durationUnit.setValue(unit);
  if (currentValue !== null) {
    form.controls.numericValue.setValue(
      unit === 'hours' ? currentValue / 60 : currentValue * 60,
    );
  }
  syncCommercialConstantValueValidators(form);
}

export function mapCommercialConstantEditorForm(
  form: CommercialConstantEditorForm,
): CommercialConstantSavePayload {
  const value = form.getRawValue();
  const base = {
    token: value.token.trim(),
    label: value.label.trim(),
  };

  switch (value.valueType) {
    case 'duration':
      return {
        ...base,
        valueType: value.valueType,
        draftValue: requireNumericValue(
          value.numericValue,
          value.durationUnit,
        ),
      };
    case 'integer':
      return {
        ...base,
        valueType: value.valueType,
        draftValue: requireNumericValue(value.numericValue),
      };
    case 'text':
      return {
        ...base,
        valueType: value.valueType,
        draftValue: value.textValue.trim(),
      };
  }
}

export function syncCommercialConstantValueValidators(
  form: CommercialConstantEditorForm,
): void {
  const valueType = form.controls.valueType.getRawValue();
  const numericValidators = getNumericValidators(
    valueType,
    () => form.controls.durationUnit.getRawValue(),
  );

  form.controls.numericValue.setValidators(numericValidators);
  form.controls.textValue.setValidators(
    valueType === 'text'
      ? [...requiredTextValidators, noNestedTokenValidator()]
      : [],
  );
  form.controls.numericValue.updateValueAndValidity({ emitEvent: false });
  form.controls.textValue.updateValueAndValidity({ emitEvent: false });
}

function getNumericValidators(
  valueType: CommercialConstantValueType,
  getDurationUnit: () => CommercialConstantDurationUnit,
): ValidatorFn[] {
  if (valueType === 'text') {
    return [];
  }

  if (valueType === 'integer') {
    return [Validators.required, integerValidator(), Validators.min(0)];
  }

  return [
    Validators.required,
    Validators.min(1 / 60),
    canonicalDurationValidator(getDurationUnit),
  ];
}

function canonicalDurationValidator(
  getUnit: () => CommercialConstantDurationUnit,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (value === null || value === '') {
      return null;
    }

    const minutes = getUnit() === 'hours' ? value * 60 : value;
    return Number.isInteger(minutes) && minutes > 0
      ? null
      : { canonicalDuration: true };
  };
}

function noNestedTokenValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null =>
    NESTED_TOKEN_PATTERN.test(String(control.value))
      ? { nestedToken: true }
      : null;
}

function getInitialDurationUnit(
  constant: CommercialConstantAdminItem | null,
): CommercialConstantDurationUnit {
  return constant?.valueType === 'duration' && constant.draftValue % 60 === 0
    ? 'hours'
    : 'minutes';
}

function getInitialNumericValue(
  constant: CommercialConstantAdminItem | null,
  durationUnit: CommercialConstantDurationUnit,
): number | null {
  if (!constant || constant.valueType === 'text') {
    return null;
  }

  return constant.valueType === 'duration' && durationUnit === 'hours'
    ? constant.draftValue / 60
    : constant.draftValue;
}

function requireNumericValue(
  value: number | null,
  durationUnit?: CommercialConstantDurationUnit,
): number {
  if (value === null) {
    throw new TypeError('A commercial constant requires a numeric value.');
  }

  return durationUnit === 'hours' ? value * 60 : value;
}
