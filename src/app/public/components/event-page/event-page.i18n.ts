import {
  createCommonActionsI18n,
  createCommonCtaI18n,
  createCommonErrorsI18n,
  createCommonLabelsI18n,
  createCommonStatusI18n,
} from '../../../core/translations/common.i18n';
import { createScopedObjectI18n } from '../../../core/translations/scoped.i18n';
import type { EventPageTranslations } from '../../../core/types/i18n/event-page';

export function createEventPageI18n() {
  return {
    page: createScopedObjectI18n<EventPageTranslations>('eventPage', 'page'),
    actions: createCommonActionsI18n(),
    cta: createCommonCtaI18n(),
    errors: createCommonErrorsI18n(),
    labels: createCommonLabelsI18n(),
    status: createCommonStatusI18n(),
  };
}
