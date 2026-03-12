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
  const errorsDict = translateObjectSignal('errors', {}, { scope: 'contact' });
  const topicsDict = translateObjectSignal('topics', {}, { scope: 'contact' });
  const infoDict = translateObjectSignal('info', {}, { scope: 'contact' });
  const statusDict = translateObjectSignal(
    'status',
    {},
    { scope: 'common' },
  );
  const commonCtaDict = translateObjectSignal('cta', {}, { scope: 'common' });

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

  const errors = pickTranslations(errorsDict, [
    'required',
    'email',
    'minMessage',
  ] as const);

  const cta = pickTranslations(commonCtaDict, ['sendMessage'] as const);
  const status = pickTranslations(statusDict, ['sending'] as const)

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
    errors,
    status,
    cta,
    info,
    topics,
  };
}
