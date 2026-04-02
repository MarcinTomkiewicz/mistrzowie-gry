import {
  CommonStatusPageTranslations,
} from '../types/i18n/common';
import { createCommonCtaI18n } from './common.i18n';
import { createScopedObjectI18n } from './scoped.i18n';

export function createStatusPageI18n(
  pageKey: 'notFound' | 'notAuthorized',
) {
  const page = createScopedObjectI18n<CommonStatusPageTranslations>(
    'common',
    `statusPages.${pageKey}`,
  );
  const cta = createCommonCtaI18n();

  return {
    page,
    cta,
  };
}
