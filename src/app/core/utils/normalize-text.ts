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
