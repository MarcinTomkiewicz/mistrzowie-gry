import type {
  CommercialPageLabelsTranslations,
  CommercialProductFieldLabelsTranslations,
  CommercialProductValueTranslations,
} from '../types/i18n/commercial-pages';
import { createScopedSectionsI18n } from './scoped.i18n';

export function createCommercialPageI18n() {
  return createScopedSectionsI18n<{
    page: CommercialPageLabelsTranslations;
    productFieldKey: CommercialProductFieldLabelsTranslations;
    productValues: CommercialProductValueTranslations;
  }>('commercialPages', {
    page: 'page',
    productFieldKey: 'productFieldKey',
    productValues: 'productValues',
  });
}
