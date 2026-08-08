import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import type {
  CommercialItemDetailsTranslations,
  CommercialPageLabelsTranslations,
  CommercialPricingTranslations,
} from '../../../core/types/i18n/commercial-pages';
import type {
  OfferFootnotesTranslations,
  OfferPricingHeadersTranslations,
} from '../../../core/types/i18n/offers';

export function createCommercialPageI18n() {
  const commercial = createScopedSectionsI18n<{
    page: CommercialPageLabelsTranslations;
    pricing: CommercialPricingTranslations;
    itemDetails: CommercialItemDetailsTranslations;
  }>('commercialPages', {
    page: 'page',
    pricing: 'pricing',
    itemDetails: 'itemDetails',
  });

  const offers = createScopedSectionsI18n<{
    pricingHeaders: OfferPricingHeadersTranslations;
    footnotes: OfferFootnotesTranslations;
  }>('offers', {
    pricingHeaders: 'pricingTable.headers',
    footnotes: 'footnotes',
  });

  return { ...commercial, ...offers };
}
