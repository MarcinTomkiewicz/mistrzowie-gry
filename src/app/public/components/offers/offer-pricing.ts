import type { OfferItemPricing } from '../../../core/types/offers';
import { formatMoney } from '../../../core/utils/pricing';

export function formatPricing(pricing: OfferItemPricing): string {
  return formatPricingDetailed(pricing)?.value ?? '';
}

export function formatPricingDetailed(pricing: OfferItemPricing) {
  const resolution = resolvePricing(pricing);
  return resolution
    ? { value: resolution.value, note: resolution.note }
    : null;
}

function resolvePricing(
  pricing: OfferItemPricing,
) {
  const currency = pricing.currency ?? 'PLN';
  const note = pricing.pricingNote ?? undefined;
  const formatLegacyMoney = (
    value: number | string | null | undefined,
  ): string | null => {
    const number = toLegacyNumber(value);
    return number === null ? null : formatMoney(number, currency);
  };
  const formatRange = (
    minValue: number | string | null | undefined,
    maxValue: number | string | null | undefined,
    suffix?: string,
  ) => {
    const min = formatLegacyMoney(minValue);
    const max = formatLegacyMoney(maxValue);
    if (!min || !max) return null;
    const value = `${min} – ${max}`;
    return {
      value: suffix ? `${value} ${suffix}` : value,
      note,
      relative: true,
    };
  };

  const range = formatRange(pricing.min, pricing.max);
  if (range) return range;
  const monthlyRange = formatRange(
    pricing.monthlyMin,
    pricing.monthlyMax,
    '/ miesiąc',
  );
  if (monthlyRange) return monthlyRange;
  const hourlyRange = formatRange(
    pricing.hourlyMin,
    pricing.hourlyMax,
    '/ godzina',
  );
  if (hourlyRange) return hourlyRange;

  const total = formatLegacyMoney(pricing.total);
  if (total) return { value: total, note, relative: false };
  const monthly = formatLegacyMoney(pricing.monthly);
  if (monthly) {
    return { value: `${monthly} / miesiąc`, note, relative: false };
  }
  const perHour = formatLegacyMoney(pricing.perHour);
  if (perHour) return { value: `${perHour} / h`, note, relative: false };
  const unit = formatLegacyMoney(pricing.unit);
  if (unit) {
    const unitLabel = pricing.unitLabel ?? '';
    return {
      value: unitLabel ? `${unit} / ${unitLabel}` : unit,
      note,
      relative: false,
    };
  }
  const minTotal = formatLegacyMoney(pricing.minTotal);
  if (minTotal) return { value: `od ${minTotal}`, note, relative: true };
  const surcharge = formatLegacyMoney(pricing.surcharge);
  if (surcharge) return { value: `+${surcharge}`, note, relative: true };
  const percent = toLegacyNumber(pricing.percentSurcharge);
  if (percent !== null) {
    return { value: `+${percent}%`, note, relative: true };
  }
  const percentMin = toLegacyNumber(pricing.percentMin);
  const percentMax = toLegacyNumber(pricing.percentMax);
  if (percentMin !== null && percentMax !== null) {
    return {
      value: `+${percentMin}% – +${percentMax}%`,
      note,
      relative: true,
    };
  }
  return null;
}

export function formatAddonPricing(pricing: OfferItemPricing) {
  const resolution = resolvePricing(pricing);
  if (!resolution) return null;

  return {
    value: resolution.relative
      ? resolution.value
      : `+${resolution.value}`,
    note: resolution.note,
  };
}

function toLegacyNumber(
  value: number | string | null | undefined,
): number | null {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }

  if (typeof value !== 'string') return null;

  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}
