import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import type {
  CommercialPageLabelsTranslations,
  CommercialPricingTranslations,
  CommercialProductFieldLabelsTranslations,
  CommercialProductValueTranslations,
} from '../../../core/types/i18n/commercial-pages';
import type { OfferFootnotesTranslations } from '../../../core/types/i18n/offers';

export function createCommercialPageI18n() {
  const commercial = createScopedSectionsI18n<{
    page: CommercialPageLabelsTranslations;
    pricing: CommercialPricingTranslations;
    productFieldKey: CommercialProductFieldLabelsTranslations;
    productValues: CommercialProductValueTranslations;
  }>('commercialPages', {
    page: 'page',
    pricing: 'pricing',
    productFieldKey: 'productFieldKey',
    productValues: 'productValues',
  });

  const offers = createScopedSectionsI18n<{
    footnotes: OfferFootnotesTranslations;
  }>('offers', {
    footnotes: 'footnotes',
  });

  return { ...commercial, ...offers };
}
