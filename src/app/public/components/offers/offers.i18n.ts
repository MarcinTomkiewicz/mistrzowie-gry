import { computed } from '@angular/core';

import {
  createCommonCtaI18n,
  createCommonEmptyI18n,
  createCommonErrorsI18n,
  createCommonSeoI18n,
  createCommonStatusI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  OfferFootnotesTranslations,
  OfferPricingHeadersTranslations,
  StandardsAndLogisticsDict,
} from '../../../core/types/i18n/offers';

export function createOffersI18n() {
  const { pricingHeaders, standardsAndLogisticsDict, commonFootnotes } =
    createScopedSectionsI18n<{
      pricingHeaders: OfferPricingHeadersTranslations;
      standardsAndLogisticsDict: StandardsAndLogisticsDict;
      commonFootnotes: OfferFootnotesTranslations;
    }>('offers', {
      pricingHeaders: 'pricingTable.headers',
      standardsAndLogisticsDict: 'standardsAndLogistics',
      commonFootnotes: 'footnotes',
    });

  const commonCta = createCommonCtaI18n();
  const commonStatus = createCommonStatusI18n();
  const commonEmpty = createCommonEmptyI18n();
  const commonErrors = createCommonErrorsI18n();
  const commonSeo = createCommonSeoI18n();

  const standardsAndLogistics = computed<StandardsAndLogisticsDict>(() => {
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
    pricingHeaders,
    commonCta,
    commonStatus,
    commonEmpty,
    commonErrors,
    commonSeo,
    commonFootnotes,
    standardsAndLogistics,
  };
}
