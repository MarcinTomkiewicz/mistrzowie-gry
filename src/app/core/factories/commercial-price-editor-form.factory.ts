import { FormControl, FormGroup, Validators } from '@angular/forms';

import type {
  CommercialCapacity,
  CommercialSchedule,
} from '../types/commercial-page';
import type { CommercialPrice } from '../types/commercial-price';
import type {
  CommercialCapacityEditorForm,
  CommercialPriceEditorForm,
  CommercialScheduleEditorForm,
} from '../types/commercial-page-editor-form';
import { setControlEnabled } from '../utils/form-controls';
import { normalizeText } from '../utils/normalize-text';
import {
  commercialCapacityValidator,
  commercialPriceValidator,
  commercialScheduleValidator,
} from '../validators/commercial-page-editor.validator';
import { integerValidator } from '../validators/form-value.validator';

const optionalNonNegativeIntegerValidators = [
  integerValidator(),
  Validators.min(0),
];
const optionalPositiveIntegerValidators = [
  integerValidator(),
  Validators.min(1),
];

export function createCommercialPriceEditorForm(
  price: CommercialPrice | null = null,
): CommercialPriceEditorForm {
  const values = getCommercialPriceEditorValues(price);

  return new FormGroup(
    {
      type: new FormControl(values.type, { nonNullable: true }),
      amount: new FormControl(values.amount),
      minAmount: new FormControl(values.minAmount),
      maxAmount: new FormControl(values.maxAmount),
      unit: new FormControl(values.unit, { nonNullable: true }),
      value: new FormControl(values.value),
      minValue: new FormControl(values.minValue),
      maxValue: new FormControl(values.maxValue),
      percentageBasis: new FormControl(values.percentageBasis, {
        nonNullable: true,
      }),
      actualCostBasis: new FormControl(values.actualCostBasis, {
        nonNullable: true,
      }),
      note: new FormControl(values.note, { nonNullable: true }),
    },
    { validators: [commercialPriceValidator] },
  );
}

export function createCommercialCapacityEditorForm(
  capacity: CommercialCapacity | null = null,
): CommercialCapacityEditorForm {
  return new FormGroup(
    {
      participantsMin: new FormControl(capacity?.participantsMin ?? null, {
        validators: optionalNonNegativeIntegerValidators,
      }),
      participantsMax: new FormControl(capacity?.participantsMax ?? null, {
        validators: optionalNonNegativeIntegerValidators,
      }),
      participantsPerFacilitatorMax: new FormControl(
        capacity?.participantsPerFacilitatorMax ?? null,
        { validators: optionalNonNegativeIntegerValidators },
      ),
      facilitatorCount: new FormControl(capacity?.facilitatorCount ?? null, {
        validators: optionalNonNegativeIntegerValidators,
      }),
      tableCount: new FormControl(capacity?.tableCount ?? null, {
        validators: optionalNonNegativeIntegerValidators,
      }),
    },
    { validators: [commercialCapacityValidator] },
  );
}

export function createCommercialScheduleEditorForm(
  schedule: CommercialSchedule | null = null,
): CommercialScheduleEditorForm {
  const form = new FormGroup(
    {
      durationMode: new FormControl(schedule?.durationMode ?? 'custom', {
        nonNullable: true,
      }),
      durationMinutes: new FormControl(schedule?.durationMinutes ?? null, {
        validators: optionalPositiveIntegerValidators,
      }),
      sessionCount: new FormControl(schedule?.sessionCount ?? null, {
        validators: optionalPositiveIntegerValidators,
      }),
      sessionsPerMonth: new FormControl(schedule?.sessionsPerMonth ?? null, {
        validators: optionalPositiveIntegerValidators,
      }),
      meetingCountMin: new FormControl(schedule?.meetingCountMin ?? null, {
        validators: optionalPositiveIntegerValidators,
      }),
      meetingCountMax: new FormControl(schedule?.meetingCountMax ?? null, {
        validators: optionalPositiveIntegerValidators,
      }),
    },
    { validators: [commercialScheduleValidator] },
  );

  syncCommercialScheduleDurationControl(form);

  return form;
}

export function syncCommercialScheduleDurationControl(
  form: CommercialScheduleEditorForm,
): void {
  setControlEnabled(
    form.controls.durationMinutes,
    form.controls.durationMode.getRawValue() === 'custom',
  );
}

export function mapCommercialPriceEditorForm(
  form: CommercialPriceEditorForm,
): CommercialPrice {
  const value = form.getRawValue();

  switch (value.type) {
    case 'fixed':
      return {
        type: value.type,
        amount: requireNumber(value.amount),
        currency: 'PLN',
        unit: value.unit,
        note: normalizeText(value.note),
      };
    case 'range':
      return {
        type: value.type,
        minAmount: requireNumber(value.minAmount),
        maxAmount: requireNumber(value.maxAmount),
        currency: 'PLN',
        unit: value.unit,
        note: normalizeText(value.note),
      };
    case 'from':
      return {
        type: value.type,
        amount: requireNumber(value.amount),
        currency: 'PLN',
        unit: value.unit,
        note: normalizeText(value.note),
      };
    case 'percentage':
      return {
        type: value.type,
        value: value.value,
        minValue: value.minValue,
        maxValue: value.maxValue,
        basis: value.percentageBasis,
        note: normalizeText(value.note),
      };
    case 'actual_cost':
      return {
        type: value.type,
        basis: value.actualCostBasis,
        note: value.note.trim(),
      };
    case 'custom_quote':
      return { type: value.type, note: value.note.trim() };
  }
}

export function mapCommercialCapacityEditorForm(
  form: CommercialCapacityEditorForm,
): CommercialCapacity {
  return form.getRawValue();
}

export function mapCommercialScheduleEditorForm(
  form: CommercialScheduleEditorForm,
): CommercialSchedule {
  const value = form.getRawValue();

  return {
    ...value,
    durationMinutes:
      value.durationMode === 'standard_session' ? null : value.durationMinutes,
  };
}

function getCommercialPriceEditorValues(price: CommercialPrice | null) {
  const values = {
    type: price?.type ?? 'fixed',
    amount: null as number | null,
    minAmount: null as number | null,
    maxAmount: null as number | null,
    unit: 'session' as const,
    value: null as number | null,
    minValue: null as number | null,
    maxValue: null as number | null,
    percentageBasis: 'base_service' as const,
    actualCostBasis: 'documented_expense' as const,
    note: price?.note ?? '',
  };

  if (!price) return values;

  switch (price.type) {
    case 'fixed':
    case 'from':
      return { ...values, amount: price.amount, unit: price.unit };
    case 'range':
      return {
        ...values,
        minAmount: price.minAmount,
        maxAmount: price.maxAmount,
        unit: price.unit,
      };
    case 'percentage':
      return {
        ...values,
        value: price.value,
        minValue: price.minValue,
        maxValue: price.maxValue,
        percentageBasis: price.basis,
      };
    case 'actual_cost':
      return { ...values, actualCostBasis: price.basis };
    case 'custom_quote':
      return values;
  }
}

function requireNumber(value: number | null): number {
  if (value === null) {
    throw new TypeError('A valid commercial price requires a numeric value.');
  }

  return value;
}
