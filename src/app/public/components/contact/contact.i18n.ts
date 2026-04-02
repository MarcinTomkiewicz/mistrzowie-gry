import { computed } from '@angular/core';

import {
  createCommonAccessibilityI18n,
  createCommonCtaI18n,
  createCommonErrorsI18n,
  createCommonFormI18n,
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
import { dictToSortedArray } from '../../../core/utils/dict-to-sorted-array';

function toSortedById<T>(dict: unknown): T[] {
  return dictToSortedArray<T>(dict as never, (x) =>
    Number((x as { id?: number })?.id ?? 0),
  );
}

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
  const accessibility = createCommonAccessibilityI18n();

  const topics = computed<ContactTopicOption[]>(() =>
    toSortedById<ContactTopicOption>(topicsDict()).map((item) => ({
      id: Number((item as { id?: number })?.id ?? 0),
      value: String((item as { value?: string })?.value ?? ''),
      label: String((item as { label?: string })?.label ?? ''),
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
    commonErrors,
    status,
    cta,
    info,
    topics,
    accessibility,
  };
}
