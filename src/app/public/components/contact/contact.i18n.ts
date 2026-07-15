import { computed } from '@angular/core';

import {
  createCommonAccessibilityI18n,
  createCommonCtaI18n,
  createCommonErrorsI18n,
  createCommonFormI18n,
  createCommonLegalNoticeI18n,
  createCommonStatusI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import { ContactTopicOption } from '../../../core/types/contact';
import {
  ContactFormErrorsTranslations,
  ContactFormTranslations,
  ContactHeroTranslations,
  ContactInfoTranslations,
  ContactSeoTranslations,
  ContactSuccessTranslations,
  ContactToastTranslations,
} from '../../../core/types/i18n/contact';
import { recordValuesSortedBy } from '../../../core/utils/record-values';

export function createContactI18n() {
  const { seo, hero, formText, formErrors, success, toast, topicsDict, info } =
    createScopedSectionsI18n<{
      seo: ContactSeoTranslations;
      hero: ContactHeroTranslations;
      formText: ContactFormTranslations;
      formErrors: ContactFormErrorsTranslations;
      success: ContactSuccessTranslations;
      toast: ContactToastTranslations;
      topicsDict: Record<string, ContactTopicOption>;
      info: ContactInfoTranslations;
    }>('contact', {
      seo: 'seo',
      hero: 'hero',
      formText: 'form',
      formErrors: 'errors',
      success: 'success',
      toast: 'toast',
      topicsDict: 'topics',
      info: 'info',
    });

  const status = createCommonStatusI18n();
  const cta = createCommonCtaI18n();
  const commonErrors = createCommonErrorsI18n();
  const commonForm = createCommonFormI18n();
  const legalNotice = createCommonLegalNoticeI18n();
  const accessibility = createCommonAccessibilityI18n();

  const topics = computed<ContactTopicOption[]>(() =>
    recordValuesSortedBy(topicsDict(), (item) => item.id).map((item) => ({
      id: item.id,
      value: item.value,
      label: item.label,
    })),
  );

  return {
    seo,
    hero,
    formText,
    formErrors,
    success,
    toast,
    commonForm,
    legalNotice,
    commonErrors,
    status,
    cta,
    info,
    topics,
    accessibility,
  };
}
