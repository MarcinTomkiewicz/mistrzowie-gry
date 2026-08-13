import type {
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { isRecord } from '../utils/is-record';

export function priceValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const value: unknown = control.getRawValue();
  if (!isRecord(value)) return { price: true };

  const type = value['type'];

  switch (type) {
    case 'fixed':
    case 'from':
      return isNonNegativeNumber(value['amount'])
        ? null
        : { price: true };
    case 'range': {
      const min = value['minAmount'];
      const max = value['maxAmount'];

      return isNonNegativeNumber(min) &&
          isNonNegativeNumber(max) &&
          min <= max
        ? null
        : { priceRange: true };
    }
    case 'percentage':
      return hasValidPercentage(value)
        ? null
        : { percentage: true };
    case 'actual_cost':
    case 'custom_quote':
      return hasText(value['note'])
        ? null
        : { priceNote: true };
    default:
      return { price: true };
  }
}

function hasValidPercentage(price: Record<string, unknown>): boolean {
  const value = price['value'];
  const min = price['minValue'];
  const max = price['maxValue'];
  const hasSingleValue = isNonNegativeNumber(value) &&
    min === null &&
    max === null;
  const hasRange = value === null &&
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
