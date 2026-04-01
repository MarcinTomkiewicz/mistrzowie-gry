import { computed } from '@angular/core';
import { translateObjectSignal } from '@jsverse/transloco';

import {
  CommonCtaTranslations,
  CommonStatusPageTranslations,
} from '../types/common-i18n';

export function createStatusPageI18n(
  pageKey: 'notFound' | 'notAuthorized',
) {
  const pageDict = translateObjectSignal(
    `statusPages.${pageKey}`,
    {},
    { scope: 'common' },
  );

  const ctaDict = translateObjectSignal(
    'cta',
    {},
    { scope: 'common' },
  );

  const page = computed(
    () => pageDict() as CommonStatusPageTranslations,
  );

  const cta = computed(
    () => ctaDict() as CommonCtaTranslations,
  );

  return {
    page,
    cta,
  };
}