import type { Price, PricePresentation } from '../types/price';
import type { PricePresentationTranslations } from '../types/i18n/price';
import { formatNumber } from './number-format';

export function formatPrice(
  price: Price,
  translations: PricePresentationTranslations,
  locale: string,
): PricePresentation {
  switch (price.type) {
    case 'fixed':
      return {
        value: formatUnitPrice(
          formatCurrency(price.amount, price.currency, locale),
          translations.units[price.unit],
        ),
        note: price.note,
      };
    case 'range':
      return {
        value: formatUnitPrice(
          `${formatCurrency(price.minAmount, price.currency, locale)} – ${formatCurrency(price.maxAmount, price.currency, locale)}`,
          translations.units[price.unit],
        ),
        note: price.note,
      };
    case 'from':
      return {
        value: formatUnitPrice(
          `${translations.from} ${formatCurrency(price.amount, price.currency, locale)}`,
          translations.units[price.unit],
        ),
        note: price.note,
      };
    case 'percentage':
      return {
        value: formatPercentage(price, translations, locale),
        note: price.note,
      };
    case 'actual_cost':
    case 'custom_quote':
      return { value: price.note, note: null };
  }
}

function formatCurrency(
  value: number,
  currency: string,
  locale: string,
): string {
  return formatNumber(value, locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatUnitPrice(value: string, unit: string): string {
  return `${value} / ${unit}`;
}

function formatPercentage(
  price: Extract<Price, { type: 'percentage' }>,
  translations: PricePresentationTranslations,
  locale: string,
): string {
  const percentage = price.value !== null
    ? formatPercentageValue(price.value, locale)
    : price.minValue !== null && price.maxValue !== null
      ? `${formatPercentageValue(
          price.minValue,
          locale,
        )} – ${formatPercentageValue(price.maxValue, locale)}`
      : '';

  return percentage
    ? `${percentage} ${translations.percentageBases[price.basis]}`
    : '';
}

function formatPercentageValue(value: number, locale: string): string {
  return `+${formatNumber(value, locale)}%`;
}
