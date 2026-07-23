export function normalizeText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

export function joinTextParts(
  parts: ReadonlyArray<string | null | undefined | false>,
  separator: string = ', ',
): string {
  return parts
    .map((part) => normalizeText(part))
    .filter((part): part is string => !!part)
    .join(separator);
}

export function stringToSlug(value: string): string {
  const polishMap: Record<string, string> = {
    ą: 'a',
    ć: 'c',
    ę: 'e',
    ł: 'l',
    ń: 'n',
    ó: 'o',
    ś: 's',
    ż: 'z',
    ź: 'z',
  };

  return value
    .toLowerCase()
    .replace(/[ąćęłńóśżź]/g, (match) => polishMap[match])
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}
