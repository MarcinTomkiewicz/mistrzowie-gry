export function formatMoney(value: number, currency: string): string {
  const decimals = value % 1 === 0 ? 0 : 2;
  return `${value.toFixed(decimals)} ${currency}`;
}
