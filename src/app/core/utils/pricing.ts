import { AnyDict } from "../types/any-dict";
import { PricingFormatted } from "../types/pricing";

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

function formatMoney(value: unknown, currency: string): string | null {
  const n = toNumber(value);
  if (n === null) return null;
  const decimals = n % 1 === 0 ? 0 : 2;
  return `${n.toFixed(decimals)} ${currency}`;
}

export function formatPricing(pricing: unknown): string {
  return formatPricingDetailed(pricing)?.value ?? '';
}

export function formatPricingDetailed(pricing: unknown): PricingFormatted | null {
  if (!pricing || typeof pricing !== 'object') return null;

  const p = pricing as AnyDict;

  const currency = typeof p['currency'] === 'string' ? p['currency'] : 'PLN';
  const note = typeof p['pricingNote'] === 'string' ? p['pricingNote'] : undefined;

  const formatRange = (minKey: string, maxKey: string, monthly = false) => {
    const minStr = formatMoney(p[minKey], currency);
    const maxStr = formatMoney(p[maxKey], currency);
    if (!minStr || !maxStr) return null;
    const base = `${minStr} – ${maxStr}`;
    return monthly ? `${base} / miesiąc` : base;
  };

  // 1) ranges
  const range = formatRange('min', 'max');
  if (range) return { value: range, note };

  const monthlyRange = formatRange('monthlyMin', 'monthlyMax', true);
  if (monthlyRange) return { value: monthlyRange, note };

  // 2) totals
  const total = formatMoney(p['total'], currency);
  if (total) return { value: total, note };

  const monthly = formatMoney(p['monthly'], currency);
  if (monthly) return { value: `${monthly} / miesiąc`, note };

  // 3) rates
  const perHour = formatMoney(p['perHour'], currency);
  if (perHour) return { value: `${perHour} / h`, note };

  const unit = formatMoney(p['unit'], currency);
  if (unit) {
    const unitLabel = typeof p['unitLabel'] === 'string' ? p['unitLabel'] : '';
    return { value: unitLabel ? `${unit} / ${unitLabel}` : unit, note };
  }

  // 4) minimum / surcharge / percent
  const minTotal = formatMoney(p['minTotal'], currency);
  if (minTotal) return { value: `od ${minTotal}`, note };

  const surcharge = formatMoney(p['surcharge'], currency);
  if (surcharge) return { value: `+${surcharge}`, note };

  const percent = toNumber(p['percentSurcharge']);
  if (percent !== null) return { value: `+${percent}%`, note };

  try {
    return { value: JSON.stringify(pricing), note };
  } catch {
    return null;
  }
}

export function formatAddonPricing(pricing: unknown): PricingFormatted | null {
  const base = formatPricingDetailed(pricing);
  if (!base) return null;

  if (base.value.startsWith('+')) return base;
  if (base.value.startsWith('od ')) return base;
  if (base.value.includes('–')) return base;
  if (base.value.includes('%')) return base;

  return { value: `+${base.value}`, note: base.note };
}