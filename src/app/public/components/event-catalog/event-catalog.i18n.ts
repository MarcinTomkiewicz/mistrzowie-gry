import {
  createCommonActionsI18n,
  createCommonCtaI18n,
  createCommonErrorsI18n,
  createCommonLabelsI18n,
  createCommonNavI18n,
  createCommonStatusI18n,
  createCommonValuesI18n,
} from '../../../core/translations/common.i18n';
import { createScopedObjectI18n } from '../../../core/translations/scoped.i18n';
import type { EventCatalogTranslations } from '../../../core/types/i18n/event-catalog';

export function createEventCatalogI18n() {
  return {
    page: createScopedObjectI18n<EventCatalogTranslations>('eventCatalog', 'page'),
    actions: createCommonActionsI18n(),
    cta: createCommonCtaI18n(),
    errors: createCommonErrorsI18n(),
    labels: createCommonLabelsI18n(),
    nav: createCommonNavI18n(),
    status: createCommonStatusI18n(),
    values: createCommonValuesI18n(),
  };
}
