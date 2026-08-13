import type {
  CommercialProductFieldKey,
  CommercialRenderProduct,
} from '../../types/commercial-page-builder';
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
        formatOptionalNumberRange(
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

function optionalText(
  value: string | null,
): CommercialProductFieldPresentation | null {
  return value === null ? null : text(value);
}

function text(value: string): CommercialProductFieldPresentation {
  return { type: 'text', value };
}
