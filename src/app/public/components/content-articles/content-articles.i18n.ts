import {
  createCommonCtaI18n,
  createCommonStatusI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  ContentArticlesCtaTranslations,
  ContentArticlesEmptyTranslations,
  ContentArticlesErrorTranslations,
  ContentArticlesHeroTranslations,
  ContentArticlesSeoTranslations,
} from '../../../core/types/i18n/content-articles';

export function createContentArticlesI18n() {
  const { hero, seo, cta, empty, errors } = createScopedSectionsI18n<{
    hero: ContentArticlesHeroTranslations;
    seo: ContentArticlesSeoTranslations;
    cta: ContentArticlesCtaTranslations;
    empty: ContentArticlesEmptyTranslations;
    errors: ContentArticlesErrorTranslations;
  }>('contentArticles', {
    hero: 'hero',
    seo: 'seo',
    cta: 'cta',
    empty: 'empty',
    errors: 'errors',
  });

  const status = createCommonStatusI18n();
  const commonCta = createCommonCtaI18n();

  return {
    hero,
    seo,
    cta,
    empty,
    errors,
    status,
    commonCta,
  };
}
