import type { OfferItemPricing } from '../../../core/types/offers';
import { formatMoney } from '../../../core/utils/pricing';

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

export function formatPricing(pricing: OfferItemPricing): string {
  return formatPricingDetailed(pricing)?.value ?? '';
}

export function formatPricingDetailed(pricing: OfferItemPricing) {
  const currency = pricing.currency ?? 'PLN';
  const note = pricing.pricingNote ?? undefined;
  const formatRange = (
    minValue: number | string | null | undefined,
    maxValue: number | string | null | undefined,
    suffix?: string,
  ) => {
    const min = formatMoney(minValue, currency);
    const max = formatMoney(maxValue, currency);
    if (!min || !max) return null;
    const value = `${min} – ${max}`;
    return suffix ? `${value} ${suffix}` : value;
  };

  const range = formatRange(pricing.min, pricing.max);
  if (range) return { value: range, note };
  const monthlyRange = formatRange(
    pricing.monthlyMin,
    pricing.monthlyMax,
    '/ miesiąc',
  );
  if (monthlyRange) return { value: monthlyRange, note };
  const hourlyRange = formatRange(
    pricing.hourlyMin,
    pricing.hourlyMax,
    '/ godzina',
  );
  if (hourlyRange) return { value: hourlyRange, note };

  const total = formatMoney(pricing.total, currency);
  if (total) return { value: total, note };
  const monthly = formatMoney(pricing.monthly, currency);
  if (monthly) return { value: `${monthly} / miesiąc`, note };
  const perHour = formatMoney(pricing.perHour, currency);
  if (perHour) return { value: `${perHour} / h`, note };
  const unit = formatMoney(pricing.unit, currency);
  if (unit) {
    const unitLabel = pricing.unitLabel ?? '';
    return { value: unitLabel ? `${unit} / ${unitLabel}` : unit, note };
  }
  const minTotal = formatMoney(pricing.minTotal, currency);
  if (minTotal) return { value: `od ${minTotal}`, note };
  const surcharge = formatMoney(pricing.surcharge, currency);
  if (surcharge) return { value: `+${surcharge}`, note };
  const percent = toNumber(pricing.percentSurcharge);
  if (percent !== null) return { value: `+${percent}%`, note };
  const percentMin = toNumber(pricing.percentMin);
  const percentMax = toNumber(pricing.percentMax);
  if (percentMin !== null && percentMax !== null) {
    return { value: `+${percentMin}% – +${percentMax}%`, note };
  }
  return null;
}

export function formatAddonPricing(pricing: OfferItemPricing) {
  const formatted = formatPricingDetailed(pricing);
  if (!formatted) return null;
  if (
    formatted.value.startsWith('+') ||
    formatted.value.startsWith('od ') ||
    formatted.value.includes('–') ||
    formatted.value.includes('%')
  ) {
    return formatted;
  }
  return { value: `+${formatted.value}`, note: formatted.note };
}
