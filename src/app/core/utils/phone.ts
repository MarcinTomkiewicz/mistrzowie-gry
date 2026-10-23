export function normalizePolishPhoneNumber(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const compact = value.replace(/[\s().-]/g, '');
  const match = /^(?:(?:\+|00)?48)?(\d{9})$/.exec(compact);
  return match ? `+48${match[1]}` : null;
}
