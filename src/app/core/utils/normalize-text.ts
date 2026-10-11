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
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ł/g, 'l')
    .replace(/ß/g, 'ss')
    .replace(/æ/g, 'ae')
    .replace(/œ/g, 'oe')
    .replace(/ø/g, 'o')
    .replace(/[đð]/g, 'd')
    .replace(/þ/g, 'th')
    .replace(/ı/g, 'i')
    .replace(/ħ/g, 'h')
    .replace(/ŋ/g, 'n')
    .replace(/ŧ/g, 't')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
