import type {
  CommercialCooperationLength,
  CommercialFrequency,
  CommercialProductFieldKey,
  CommercialRenderProduct,
} from '../../types/commercial-product';
import type { CommercialProductValueTranslations } from '../../types/i18n/commercial-pages';
import type { CommercialProductFieldPresentation } from '../../types/commercial-page-presentation';
import { formatDuration } from '../../utils/duration-format';
import {
  formatNumber,
  formatOptionalNumberRange,
  formatPluralNumber,
} from '../../utils/number-format';

export function formatCommercialProductField(
  product: CommercialRenderProduct,
  key: CommercialProductFieldKey,
  translations: CommercialProductValueTranslations,
  fromLabel: string,
  toLabel: string,
  notApplicableLabel: string,
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
      return product.prices.length
        ? { type: 'prices', value: product.prices }
        : null;
    case 'primaryPrices': {
      const prices = product.prices.filter((entry) => entry.primary);
      return prices.length ? { type: 'prices', value: prices } : null;
    }
    case 'variantPrices': {
      const prices = product.prices.filter((entry) => !entry.primary);
      return prices.length ? { type: 'prices', value: prices } : null;
    }
    case 'duration':
      return product.duration.mode === 'not_applicable'
        ? null
        : text(
            formatDuration(
              product.duration.minutes,
              translations.duration,
              locale,
            ),
          );
    case 'participants':
      return product.participants.mode === 'not_applicable'
        ? null
        : optionalText(
            formatOptionalNumberRange(
              product.participants.min,
              product.participants.max,
              fromLabel,
              toLabel,
              locale,
            ),
          );
    case 'participantsPerFacilitatorMax':
      return optionalNumber(
        product.participants.perFacilitatorMax,
        locale,
      );
    case 'participantsMin':
      return optionalNumber(product.participantsMin, locale);
    case 'participantsMax':
      return optionalNumber(product.participantsMax, locale);
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
    case 'frequency':
      return text(
        formatCommercialFrequency(
          product.frequency,
          translations,
          notApplicableLabel,
          locale,
        ),
      );
    case 'cooperationLength':
      return text(
        formatCommercialCooperationLength(
          product.cooperationLength,
          translations,
          notApplicableLabel,
          locale,
        ),
      );
    case 'meetingCount':
      return optionalText(
        formatOptionalNumberRange(
          product.meetingCountMin,
          product.meetingCountMax,
          fromLabel,
          toLabel,
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
    case 'settlement':
      return optionalText(product.settlement);
    case 'participantPrice':
      return optionalPrice(product.participantPrice);
    case 'facilitatorPrice':
      return optionalPrice(product.facilitatorPrice);
  }
}

export function formatCommercialFrequency(
  frequency: CommercialFrequency,
  translations: CommercialProductValueTranslations,
  notApplicableLabel: string,
  locale: string,
): string {
  const copy = translations.frequency;

  switch (frequency.mode) {
    case 'not_applicable':
      return notApplicableLabel;
    case 'one_time':
      return copy.oneTime;
    case 'weekly':
      return frequency.count === 1
        ? copy.weeklyOnce
        : `${formatNumber(frequency.count, locale)} ${copy.weeklyMany}`;
    case 'monthly':
      return frequency.count === 1
        ? copy.monthlyOnce
        : `${formatNumber(frequency.count, locale)} ${copy.monthlyMany}`;
  }
}

export function formatCommercialCooperationLength(
  cooperationLength: CommercialCooperationLength,
  translations: CommercialProductValueTranslations,
  notApplicableLabel: string,
  locale: string,
): string {
  const copy = translations.cooperationLength;

  switch (cooperationLength.mode) {
    case 'not_applicable':
      return notApplicableLabel;
    case 'one_time':
      return copy.oneTime;
    case 'exact':
      return formatPluralNumber(
        cooperationLength.semesters,
        copy.semesters,
        locale,
      );
    case 'minimum':
      return `${copy.minimum} ${formatPluralNumber(
        cooperationLength.semesters,
        copy.semesters,
        locale,
      )}`;
  }
}

function formatCommercialSessions(
  mode: 'total' | 'per_month',
  count: number,
  translations: CommercialProductValueTranslations,
  locale: string,
): string {
  const value = formatPluralNumber(
    count,
    translations.sessions.count,
    locale,
  );

  return mode === 'per_month'
    ? `${value} ${translations.sessions.perMonth}`
    : value;
}

function optionalNumber(
  value: number | null,
  locale: string,
): CommercialProductFieldPresentation | null {
  return value === null ? null : text(formatNumber(value, locale));
}

function optionalPrice(
  value: CommercialRenderProduct['participantPrice'],
): CommercialProductFieldPresentation | null {
  return value === null ? null : { type: 'price', value };
}

function optionalText(
  value: string | null,
): CommercialProductFieldPresentation | null {
  return value === null ? null : text(value);
}

function text(value: string): CommercialProductFieldPresentation {
  return { type: 'text', value };
}
