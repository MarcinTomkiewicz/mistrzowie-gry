import { computed } from '@angular/core';

import {
  createCommonAccessibilityI18n,
  createCommonActionsI18n,
  createCommonCtaI18n,
  createCommonErrorsI18n,
  createCommonFormI18n,
  createCommonLegalI18n,
  createCommonLabelsI18n,
  createCommonNavI18n,
  createCommonStatusI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import { ContactTopicOption } from '../../../core/types/contact';
import {
  ContactFormErrorsTranslations,
  ContactFormTranslations,
  ContactHeroTranslations,
  ContactInfoTranslations,
  ContactLegalNoticeTranslations,
  ContactSeoTranslations,
  ContactSuccessTranslations,
  ContactToastTranslations,
  ContactTopicTranslation,
} from '../../../core/types/i18n/contact';
import { recordValuesSortedBy } from '../../../core/utils/record-values';

export function createContactI18n() {
  const {
    seo,
    hero,
    formText,
    formErrors,
    success,
    toast,
    topicsDict,
    info,
    legalNotice,
  } =
    createScopedSectionsI18n<{
      seo: ContactSeoTranslations;
      hero: ContactHeroTranslations;
      formText: ContactFormTranslations;
      formErrors: ContactFormErrorsTranslations;
      success: ContactSuccessTranslations;
      toast: ContactToastTranslations;
      topicsDict: Record<string, ContactTopicTranslation>;
      info: ContactInfoTranslations;
      legalNotice: ContactLegalNoticeTranslations;
    }>('contact', {
      seo: 'seo',
      hero: 'hero',
      formText: 'form',
      formErrors: 'errors',
      success: 'success',
      toast: 'toast',
      topicsDict: 'topics',
      info: 'info',
      legalNotice: 'legalNotice',
    });

  const status = createCommonStatusI18n();
  const commonActions = createCommonActionsI18n();
  const cta = createCommonCtaI18n();
  const commonErrors = createCommonErrorsI18n();
  const commonForm = createCommonFormI18n();
  const commonLegal = createCommonLegalI18n();
  const accessibility = createCommonAccessibilityI18n();
  const commonLabels = createCommonLabelsI18n();
  const commonNav = createCommonNavI18n();

  const topics = computed<ContactTopicOption[]>(() =>
    recordValuesSortedBy(topicsDict(), (item) => item.id).map((item) => ({
      id: item.id,
      value: item.value,
      label: item.value === 'join'
        ? commonNav().join
        : item.value === 'chaotic'
          ? commonNav().chaoticThursdays
          : item.label,
    })),
  );

  return {
    seo,
    hero,
    formText,
    formErrors,
    success,
    toast,
    commonActions,
    commonForm,
    commonLegal,
    legalNotice,
    commonErrors,
    status,
    cta,
    info,
    topics,
    accessibility,
    commonLabels,
    commonNav,
  };
}
