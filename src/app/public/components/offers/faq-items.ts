import { DisplayFaqItem } from '../../../core/types/faq-items';

export function normalizeFaqItems(value: unknown): DisplayFaqItem[] {
  const values = Array.isArray(value)
    ? value
    : value !== null && typeof value === 'object'
      ? Object.values(value)
      : [];

  return values.filter(
    (item): item is DisplayFaqItem =>
      item !== null &&
      typeof item === 'object' &&
      'h' in item &&
      typeof item.h === 'string' &&
      'a' in item &&
      typeof item.a === 'string',
  );
}
