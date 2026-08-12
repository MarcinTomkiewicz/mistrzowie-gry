import type {
  CommercialProductFieldKey,
  CommercialRenderProduct,
} from '../types/commercial-page-builder';
import type { CommercialProductValueTranslations } from '../types/i18n/commercial-pages';
import type { CommercialPrice } from '../types/commercial-price';
import type { RichContent } from '../types/rich-content';

type CommercialProductFieldPresentation =
  | { type: 'text'; value: string }
  | { type: 'rich_content'; value: RichContent }
  | { type: 'price'; value: CommercialPrice };

export function formatCommercialProductField(
  product: CommercialRenderProduct,
  key: CommercialProductFieldKey,
  translations: CommercialProductValueTranslations,
  locale: string,
): CommercialProductFieldPresentation | null {
  switch (key) {
    case 'name':
      return text(product.name);
    case 'description':
      return product.description
        ? { type: 'rich_content', value: product.description }
        : null;
    case 'price':
      return { type: 'price', value: product.price };
    case 'duration':
      return product.duration.mode === 'not_applicable'
        ? null
        : text(
            formatCommercialDuration(
              product.duration.minutes,
              translations,
              locale,
            ),
          );
    case 'participants':
      return product.participants.mode === 'not_applicable'
        ? null
        : optionalText(
            formatCommercialOptionalNumberRange(
              product.participants.min,
              product.participants.max,
              translations,
              locale,
            ),
          );
    case 'participantsPerFacilitatorMax':
      return optionalNumber(
        product.participants.perFacilitatorMax,
        locale,
      );
    case 'sessions':
      return product.sessions.mode === 'not_applicable'
        ? null
        : text(
            formatCommercialSessions(
              product.sessions.mode,
              product.sessions.count,
              translations,
              locale,
            ),
          );
    case 'meetingCount':
      return optionalText(
        formatCommercialOptionalNumberRange(
          product.meetingCountMin,
          product.meetingCountMax,
          translations,
          locale,
        ),
      );
    case 'facilitatorCount':
      return optionalNumber(product.facilitatorCount, locale);
    case 'tableCount':
      return optionalNumber(product.tableCount, locale);
    case 'includedAddons':
      return optionalText(
        product.includedAddons.length
          ? product.includedAddons.map((addon) => addon.name).join(', ')
          : null,
      );
  }
}

export function formatCommercialDuration(
  minutes: number,
  translations: CommercialProductValueTranslations,
  locale: string,
): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const numberFormat = new Intl.NumberFormat(locale);
  const pluralRules = new Intl.PluralRules(locale);
  const parts: string[] = [];

  if (hours) {
    parts.push(
      formatPluralUnit(
        hours,
        translations.duration.hours,
        numberFormat,
        pluralRules,
      ),
    );
  }

  if (remainingMinutes || !hours) {
    parts.push(
      formatPluralUnit(
        remainingMinutes,
        translations.duration.minutes,
        numberFormat,
        pluralRules,
      ),
    );
  }

  return parts.join(' ');
}

function formatCommercialSessions(
  mode: 'total' | 'per_month',
  count: number,
  translations: CommercialProductValueTranslations,
  locale: string,
): string {
  const value = formatPluralUnit(
    count,
    translations.sessions.count,
    new Intl.NumberFormat(locale),
    new Intl.PluralRules(locale),
  );

  return mode === 'per_month'
    ? `${value} ${translations.sessions.perMonth}`
    : value;
}

function formatPluralUnit(
  value: number,
  translations: CommercialProductValueTranslations['duration']['hours'],
  numberFormat: Intl.NumberFormat,
  pluralRules: Intl.PluralRules,
): string {
  const category = pluralRules.select(value);
  let unit: string;

  switch (category) {
    case 'one':
      unit = translations.one;
      break;
    case 'few':
      unit = translations.few;
      break;
    case 'many':
      unit = translations.many;
      break;
    default:
      unit = translations.other;
  }

  return `${numberFormat.format(value)} ${unit}`;
}

export function formatCommercialOptionalNumberRange(
  min: number | null,
  max: number | null,
  translations: CommercialProductValueTranslations,
  locale: string,
): string | null {
  if (min === null) {
    if (max === null) return null;

    return `${translations.to} ${formatNumber(max, locale)}`;
  }

  if (max === null) {
    return `${translations.from} ${formatNumber(min, locale)}`;
  }

  return formatCommercialNumberRange(min, max, locale);
}

function formatCommercialNumberRange(
  min: number,
  max: number,
  locale: string,
): string {
  if (min === max) return formatNumber(min, locale);

  return `${formatNumber(min, locale)}–${formatNumber(max, locale)}`;
}

function optionalNumber(
  value: number | null,
  locale: string,
): CommercialProductFieldPresentation | null {
  return value === null ? null : text(formatNumber(value, locale));
}

function optionalText(
  value: string | null,
): CommercialProductFieldPresentation | null {
  return value === null ? null : text(value);
}

function text(value: string): CommercialProductFieldPresentation {
  return { type: 'text', value };
}

function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}
