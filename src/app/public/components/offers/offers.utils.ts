import {
  OfferItemKindEnum,
  OfferSectionTypeEnum,
} from '../../../core/enums/offers';
import { DisplayFaqItem } from '../../../core/types/faq-items';

export function normalizeFaqItems(value: unknown): DisplayFaqItem[] {
  const items = Array.isArray(value)
    ? value
    : value !== null && typeof value === 'object'
      ? Object.values(value)
      : [];

  return items.filter(
    (item): item is DisplayFaqItem =>
      item !== null &&
      typeof item === 'object' &&
      'h' in item &&
      typeof item.h === 'string' &&
      'a' in item &&
      typeof item.a === 'string',
  );
}

export function findSectionByType<T extends { type: string }>(
  sections: readonly T[] | null | undefined,
  type: OfferSectionTypeEnum,
): T | null {
  return sections?.find((section) => section.type === type) ?? null;
}

export function findCardsSectionByKind<
  T extends { type: string; itemKind: string | null }
>(
  sections: readonly T[] | null | undefined,
  kind: OfferItemKindEnum,
): T | null {
  return (
    sections?.find(
      (section) =>
        section.type === OfferSectionTypeEnum.Cards &&
        section.itemKind === kind,
    ) ?? null
  );
}
