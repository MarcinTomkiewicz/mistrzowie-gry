import { translateObjectSignal } from '@jsverse/transloco';
import { pickTranslations } from '../../../core/utils/pick-translation';
import { computed } from '@angular/core';
import { OfferPageSeo } from '../../../core/types/offers';

export function createOffersI18n() {
  const pricingHeadersDict = translateObjectSignal(
    'pricingTable.headers',
    {},
    { scope: 'offers' },
  );

  const seoDict = translateObjectSignal('seo', {}, { scope: 'offers' });

  const commonCtaDict = translateObjectSignal('cta', {}, { scope: 'common' });
  const commonStatusDict = translateObjectSignal(
    'status',
    {},
    { scope: 'common' },
  );
  const commonEmptyDict = translateObjectSignal(
    'empty',
    {},
    { scope: 'common' },
  );
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

  const commonCta = pickTranslations(commonCtaDict, ['contactUs', 'showMore', 'showLess'] as const);

  const commonStatus = pickTranslations(commonStatusDict, ['loading'] as const);

  const commonEmpty = pickTranslations(commonEmptyDict, [
    'title',
    'description',
  ] as const);

  const seo = computed<OfferPageSeo>(() => {
    const picked = pickTranslations(seoDict, [
      'title',
      'description',
    ] as const)();

    return {
      title: picked.title || 'O nas',
      description: picked.description || '',
    };
  });

  const commonFootnotes = pickTranslations(commonFootnotesDict, [
    'net',
    'gross',
  ] as const);

  return {
    seo,
    pricingHeaders,
    commonCta,
    commonStatus,
    commonEmpty,
    commonFootnotes,
  };
}
