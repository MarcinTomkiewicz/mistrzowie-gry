import type {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

export const commercialInternalRouteValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value: unknown = control.value;

  if (typeof value !== 'string' || !value.trim()) return null;

  return value.startsWith('/') && !value.startsWith('//')
    ? null
    : { commercialInternalRoute: true };
};

export const commercialPriceValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const type = valueOf(control, 'type');

  switch (type) {
    case 'fixed':
    case 'from':
      return isNonNegativeNumber(valueOf(control, 'amount'))
        ? null
        : { commercialPrice: true };
    case 'range': {
      const min = valueOf(control, 'minAmount');
      const max = valueOf(control, 'maxAmount');

      return isNonNegativeNumber(min) &&
        isNonNegativeNumber(max) &&
        min <= max
        ? null
        : { commercialPriceRange: true };
    }
    case 'percentage':
      return hasValidPercentage(control)
        ? null
        : { commercialPercentage: true };
    case 'actual_cost':
    case 'custom_quote':
      return hasText(valueOf(control, 'note'))
        ? null
        : { commercialPriceNote: true };
    default:
      return { commercialPrice: true };
  }
};

function hasValidPercentage(control: AbstractControl): boolean {
  const value = valueOf(control, 'value');
  const min = valueOf(control, 'minValue');
  const max = valueOf(control, 'maxValue');
  const hasSingleValue = isNonNegativeNumber(value) && min === null && max === null;
  const hasRange =
    value === null &&
    isNonNegativeNumber(min) &&
    isNonNegativeNumber(max) &&
    min <= max;

  return hasSingleValue || hasRange;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' && !!value.trim();
}

function valueOf(control: AbstractControl, name: string): unknown {
  return control.get(name)?.value;
}
