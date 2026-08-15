import type {
  PluralNumberTranslations,
} from '../types/number-format';

export function formatNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatPluralNumber(
  value: number,
  translations: PluralNumberTranslations,
  locale: string,
): string {
  const category = new Intl.PluralRules(locale).select(value);
  const unit = category === 'one' || category === 'few' || category === 'many'
    ? translations[category]
    : translations.other;

  return `${formatNumber(value, locale)} ${unit}`;
}

function formatNumberRange(
  min: number,
  max: number,
  locale: string,
): string {
  if (min === max) return formatNumber(min, locale);

  return `${formatNumber(min, locale)}–${formatNumber(max, locale)}`;
}

export function formatOptionalNumberRange(
  min: number | null,
  max: number | null,
  fromLabel: string,
  toLabel: string,
  locale: string,
): string | null {
  if (min === null) {
    return max === null
      ? null
      : `${toLabel} ${formatNumber(max, locale)}`;
  }

  return max === null
    ? `${fromLabel} ${formatNumber(min, locale)}`
    : formatNumberRange(min, max, locale);
}
