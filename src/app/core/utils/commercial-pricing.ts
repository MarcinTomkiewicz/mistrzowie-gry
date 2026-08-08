import type { CommercialPricingTranslations } from '../types/i18n/commercial-pages';
import type { CommercialPrice } from '../types/commercial-price';

type CommercialPricePresentation = {
  value: string;
  note: string | null;
};

export function formatCommercialPrice(
  price: CommercialPrice,
  translations: CommercialPricingTranslations,
  locale: string,
): CommercialPricePresentation {
  switch (price.type) {
    case 'fixed':
      return {
        value: formatUnitPrice(
          formatAmount(price.amount, price.currency, locale),
          translations.units[price.unit],
        ),
        note: price.note,
      };
    case 'range':
      return {
        value: formatUnitPrice(
          `${formatAmount(price.minAmount, price.currency, locale)} – ${formatAmount(price.maxAmount, price.currency, locale)}`,
          translations.units[price.unit],
        ),
        note: price.note,
      };
    case 'from':
      return {
        value: formatUnitPrice(
          `${translations.from} ${formatAmount(price.amount, price.currency, locale)}`,
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
      return {
        value: price.note,
        note: null,
      };
  }
}

function formatUnitPrice(value: string, unit: string): string {
  return `${value} / ${unit}`;
}

function formatAmount(
  amount: number,
  currency: string,
  locale: string,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatPercentage(
  price: Extract<CommercialPrice, { type: 'percentage' }>,
  translations: CommercialPricingTranslations,
  locale: string,
): string {
  const percentage =
    price.value !== null
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
  return `+${new Intl.NumberFormat(locale).format(value)}%`;
}
