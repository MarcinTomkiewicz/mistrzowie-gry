import { computed } from '@angular/core';

import {
  createCommonCtaI18n,
  createCommonEmptyI18n,
  createCommonErrorsI18n,
  createCommonLabelsI18n,
  createCommonPriceI18n,
  createCommonSeoI18n,
  createCommonStatusI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  OfferCtaTranslations,
  OfferPricingHeadersTranslations,
  StandardsAndLogisticsDict,
} from '../../../core/types/i18n/offers';

export function createOffersI18n() {
  const { cta, pricingHeaders, standardsAndLogisticsDict } =
    createScopedSectionsI18n<{
      cta: OfferCtaTranslations;
      pricingHeaders: OfferPricingHeadersTranslations;
      standardsAndLogisticsDict: StandardsAndLogisticsDict;
    }>('offers', {
      cta: 'cta',
      pricingHeaders: 'pricingTable.headers',
      standardsAndLogisticsDict: 'standardsAndLogistics',
    });

  const commonCta = createCommonCtaI18n();
  const commonStatus = createCommonStatusI18n();
  const commonEmpty = createCommonEmptyI18n();
  const commonErrors = createCommonErrorsI18n();
  const commonLabels = createCommonLabelsI18n();
  const commonSeo = createCommonSeoI18n();
  const commonPrice = createCommonPriceI18n();
  const commonFootnotes = computed(() => commonPrice().footnotes);

  const standardsAndLogistics = computed(() => {
    const dict = standardsAndLogisticsDict();

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
    cta,
    pricingHeaders,
    commonCta,
    commonStatus,
    commonEmpty,
    commonErrors,
    commonLabels,
    commonSeo,
    commonFootnotes,
    standardsAndLogistics,
  };
}
