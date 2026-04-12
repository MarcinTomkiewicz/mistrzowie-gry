import { normalizeText } from './normalize-text';

export function resolveLanguageFlagClass(
  flagCode: string | null | undefined,
): string | null {
  const code = normalizeText(flagCode)?.toLowerCase();

  return code ? `fi fi-${code}` : null;
}
