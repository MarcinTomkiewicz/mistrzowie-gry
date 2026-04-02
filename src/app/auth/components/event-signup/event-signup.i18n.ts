import { createCommonStatusI18n } from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  EventSignupDetailsTranslations,
  EventSignupEmptyTranslations,
  EventSignupOccurrencesTranslations,
  EventSignupPageTranslations,
  EventSignupSeoTranslations,
} from '../../../core/types/i18n/auth';

export function createEventSignupI18n() {
  const { seo, page, details, occurrences, empty } =
    createScopedSectionsI18n<{
      seo: EventSignupSeoTranslations;
      page: EventSignupPageTranslations;
      details: EventSignupDetailsTranslations;
      occurrences: EventSignupOccurrencesTranslations;
      empty: EventSignupEmptyTranslations;
    }>('auth', {
      seo: 'eventSignup.seo',
      page: 'eventSignup.page',
      details: 'eventSignup.details',
      occurrences: 'eventSignup.occurrences',
      empty: 'eventSignup.empty',
    });
  const commonStatus = createCommonStatusI18n();

  return {
    seo,
    page,
    details,
    occurrences,
    empty,
    commonStatus,
  };
}
