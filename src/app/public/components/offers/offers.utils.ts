export function findSectionByType<T extends { type: string }>(
  sections: readonly T[] | null | undefined,
  type: string,
): T | null {
  return sections?.find((section) => section.type === type) ?? null;
}

export function findCardsSectionByKind<
  T extends { type: string; itemKind: string | null }
>(
  sections: readonly T[] | null | undefined,
  kind: string,
): T | null {
  return (
    sections?.find(
      (section) => section.type === 'cards' && section.itemKind === kind,
    ) ?? null
  );
}