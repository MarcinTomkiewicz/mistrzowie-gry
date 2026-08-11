import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import type {
  CommercialPageLabelsTranslations,
  CommercialPricingTranslations,
  CommercialProductValueTranslations,
} from '../../../core/types/i18n/commercial-pages';
import type { OfferFootnotesTranslations } from '../../../core/types/i18n/offers';

export function createCommercialPageI18n() {
  const commercial = createScopedSectionsI18n<{
    page: CommercialPageLabelsTranslations;
    pricing: CommercialPricingTranslations;
    productValues: CommercialProductValueTranslations;
  }>('commercialPages', {
    page: 'page',
    pricing: 'pricing',
    productValues: 'productValues',
  });

  const offers = createScopedSectionsI18n<{
    footnotes: OfferFootnotesTranslations;
  }>('offers', {
    footnotes: 'footnotes',
  });

  return { ...commercial, ...offers };
}
