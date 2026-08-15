import type {
  CommercialPageLabelsTranslations,
  CommercialProductFieldLabelsTranslations,
  CommercialProductValueTranslations,
} from '../types/i18n/commercial-pages';
import type { CommercialProductFieldKey } from '../types/commercial-page-builder';
import { createCommonLabelsI18n } from './common.i18n';
import { createScopedSectionsI18n } from './scoped.i18n';

export function createCommercialPageI18n() {
  const sections = createScopedSectionsI18n<{
    page: CommercialPageLabelsTranslations;
    productFieldKey: CommercialProductFieldLabelsTranslations;
    productValues: CommercialProductValueTranslations;
  }>('commercialPages', {
    page: 'page',
    productFieldKey: 'productFieldKey',
    productValues: 'productValues',
  });
  const commonLabels = createCommonLabelsI18n();

  return {
    ...sections,
    commonLabels,
    productFieldLabel: (key: CommercialProductFieldKey): string => {
      const labels = commonLabels();

      switch (key) {
        case 'name':
          return labels.name;
        case 'description':
          return labels.description;
        case 'price':
          return labels.price;
        case 'duration':
          return labels.duration;
        case 'participants':
          return labels.participants;
        case 'facilitatorCount':
          return labels.facilitatorCount;
        case 'tableCount':
          return labels.tableCount;
        default:
          return sections.productFieldKey()[key];
      }
    },
  };
}
