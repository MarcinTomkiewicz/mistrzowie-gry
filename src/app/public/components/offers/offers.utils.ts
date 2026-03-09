import {
  OfferItemKindEnum,
  OfferSectionTypeEnum,
} from '../../../core/enums/offers';

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