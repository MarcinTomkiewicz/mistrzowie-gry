import { computed } from '@angular/core';
import { translateObjectSignal, translateSignal } from '@jsverse/transloco';

import { ContactTopicOption } from '../../../core/types/contact';
import { dictToSortedArray } from '../../../core/utils/dict-to-sorted-array';
import { pickTranslations } from '../../../core/utils/pick-translation';

function toSortedById<T>(dict: unknown): T[] {
  return dictToSortedArray<T>(dict as never, (x) =>
    Number((x as { id?: number })?.id ?? 0),
  );
}

export function createContactI18n() {
  const seoTitle = translateSignal('seo.title', {}, { scope: 'contact' });
  const seoDescription = translateSignal(
    'seo.description',
    {},
    { scope: 'contact' },
  );

  const heroDict = translateObjectSignal('hero', {}, { scope: 'contact' });
  const formDict = translateObjectSignal('form', {}, { scope: 'contact' });
  const formErrorsDict = translateObjectSignal(
    'errors',
    {},
    { scope: 'contact' },
  );
  const successDict = translateObjectSignal('success', {}, { scope: 'contact' });
  const toastDict = translateObjectSignal('toast', {}, { scope: 'contact' });
  const topicsDict = translateObjectSignal('topics', {}, { scope: 'contact' });
  const infoDict = translateObjectSignal('info', {}, { scope: 'contact' });

  const statusDict = translateObjectSignal('status', {}, { scope: 'common' });
  const commonCtaDict = translateObjectSignal('cta', {}, { scope: 'common' });
  const commonErrorsDict = translateObjectSignal(
    'errors',
    {},
    { scope: 'common' },
  );
  const commonFormDict = translateObjectSignal('form', {}, { scope: 'common' });

  const hero = pickTranslations(heroDict, ['title', 'subtitle'] as const);

  const formText = pickTranslations(formDict, [
    'title',
    'hint',
    'topicLabel',
    'topicCustomLabel',
    'firstNameLabel',
    'lastNameLabel',
    'companyLabel',
    'emailLabel',
    'phoneLabel',
    'messageLabel',
    'messagePlaceholder',
  ] as const);

  const formErrors = pickTranslations(formErrorsDict, [
    'required',
    'email',
    'minMessage',
  ] as const);

  const success = pickTranslations(successDict, ['mailSent'] as const);

  const toast = pickTranslations(toastDict, [
    'invalidFormSummary',
    'mailSentSummary',
    'sendFailedSummary',
  ] as const);

  const commonForm = pickTranslations(commonFormDict, ['invalid'] as const);

  const commonErrors = pickTranslations(commonErrorsDict, [
    'generic',
    'network',
    'notFound',
    'forbidden',
    'unauthorized',
    'timeout',
    'server',
  ] as const);

  const cta = pickTranslations(commonCtaDict, ['sendMessage'] as const);
  const status = pickTranslations(statusDict, ['sending'] as const);

  const info = pickTranslations(infoDict, [
    'title',
    'subtitle',
    'emailLabel',
    'phoneLabel',
    'emailValue',
    'phoneValue',
  ] as const);

  const topics = computed<ContactTopicOption[]>(() =>
    toSortedById<ContactTopicOption>(topicsDict()).map((item) => ({
      id: Number((item as { id?: number })?.id ?? 0),
      value: String((item as { value?: string })?.value ?? ''),
      label: String((item as { label?: string })?.label ?? ''),
    })),
  );

  return {
    seoTitle,
    seoDescription,
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
  };
}