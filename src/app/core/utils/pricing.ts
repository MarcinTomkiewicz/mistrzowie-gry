function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

export function formatMoney(value: unknown, currency: string): string | null {
  const n = toNumber(value);
  if (n === null) return null;
  const decimals = n % 1 === 0 ? 0 : 2;
  return `${n.toFixed(decimals)} ${currency}`;
}
