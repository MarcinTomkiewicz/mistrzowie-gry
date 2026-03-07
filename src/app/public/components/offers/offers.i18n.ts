import { translateObjectSignal } from '@jsverse/transloco';
import { pickTranslations } from '../../../core/utils/pick-translation';

export function createOffersI18n() {
  const pricingHeadersDict = translateObjectSignal(
    'pricingTable.headers',
    {},
    { scope: 'offers' },
  );

  const commonCtaDict = translateObjectSignal('cta', {}, { scope: 'common' });
  const commonStatusDict = translateObjectSignal('status', {}, { scope: 'common' });
  const commonEmptyDict = translateObjectSignal('empty', {}, { scope: 'common' });
  const commonFootnotesDict = translateObjectSignal(
    'footnotes',
    {},
    { scope: 'common' },
  );

  const pricingHeaders = pickTranslations(pricingHeadersDict, [
    'variant',
    'price',
    'description',
  ] as const);

  const commonCta = pickTranslations(commonCtaDict, ['contactUs'] as const);

  const commonStatus = pickTranslations(commonStatusDict, ['loading'] as const);

  const commonEmpty = pickTranslations(commonEmptyDict, [
    'title',
    'description',
  ] as const);

  const commonFootnotes = pickTranslations(commonFootnotesDict, [
    'net',
    'gross',
  ] as const);

  return {
    pricingHeaders,
    commonCta,
    commonStatus,
    commonEmpty,
    commonFootnotes,
  };
}