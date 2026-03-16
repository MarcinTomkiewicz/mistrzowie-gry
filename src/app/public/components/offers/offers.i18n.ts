import { computed } from '@angular/core';
import { translateObjectSignal } from '@jsverse/transloco';

import { OfferPageSeo } from '../../../core/types/offers';
import { pickTranslations } from '../../../core/utils/pick-translation';

type StandardsAndLogisticsFaqItem = {
  h: string;
  a: string;
};

type StandardsAndLogisticsCardItem = {
  title: string;
  lead: string;
};

type StandardsAndLogisticsPricingItem = {
  title: string;
  value?: string;
  note?: string;
};

type StandardsAndLogisticsDict = {
  intro?: {
    title?: string;
    subtitle?: string;
  };
  standard?: {
    title?: string;
    subtitle?: string;
    items?: StandardsAndLogisticsCardItem[];
  };
  logistics?: {
    title?: string;
    subtitle?: string;
    items?: StandardsAndLogisticsPricingItem[];
  };
  faq?: {
    title?: string;
    subtitle?: string;
    items?: StandardsAndLogisticsFaqItem[];
  };
};

export function createOffersI18n() {
  const pricingHeadersDict = translateObjectSignal(
    'pricingTable.headers',
    {},
    { scope: 'offers' },
  );

  const seoDict = translateObjectSignal('seo', {}, { scope: 'offers' });

  const standardsAndLogisticsDict = translateObjectSignal(
    'standardsAndLogistics',
    {},
    { scope: 'offers' },
  );

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
    'variantLabel',
    'price',
    'description',
  ] as const);

  const commonCta = pickTranslations(commonCtaDict, [
    'contactUs',
    'showMore',
    'showLess',
  ] as const);

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
    'both'
  ] as const);

  const standardsAndLogistics = computed<StandardsAndLogisticsDict>(() => {
    const dict = standardsAndLogisticsDict() as StandardsAndLogisticsDict;

    return {
      intro: {
        title: dict?.intro?.title || '',
        subtitle: dict?.intro?.subtitle || '',
      },
      standard: {
        title: dict?.standard?.title || '',
        subtitle: dict?.standard?.subtitle || '',
        items: Array.isArray(dict?.standard?.items) ? dict.standard.items : [],
      },
      faq: {
        title: dict?.faq?.title || '',
        subtitle: dict?.faq?.subtitle || '',
        items: Array.isArray(dict?.faq?.items) ? dict.faq.items : [],
      },
    };
  });

  return {
    seo,
    pricingHeaders,
    commonCta,
    commonStatus,
    commonEmpty,
    commonFootnotes,
    standardsAndLogistics,
  };
}