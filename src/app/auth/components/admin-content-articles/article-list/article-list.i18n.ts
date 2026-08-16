import {
  createCommonActionsI18n,
  createCommonEmptyI18n,
  createCommonErrorsI18n,
  createCommonLabelsI18n,
  createCommonNavI18n,
  createCommonStatusI18n,
  createCommonTableI18n,
  createCommonValuesI18n,
} from '../../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import {
  AdminContentArticlesActionsTranslations,
  AdminContentArticlesFiltersTranslations,
  AdminContentArticlePublicationValidationTranslations,
  AdminContentArticleStatusLabelTranslations,
  AdminContentArticlesPageTranslations,
  AdminContentArticlesTableTranslations,
  AdminContentArticlesToastTranslations,
} from '../../../../core/types/i18n/admin-content-articles';

export function createAdminContentArticleListI18n() {
  const {
    page,
    filters,
    table,
    actions,
    publicationValidation,
    toast,
    statusLabels,
  } =
    createScopedSectionsI18n<{
      page: AdminContentArticlesPageTranslations;
      filters: AdminContentArticlesFiltersTranslations;
      table: AdminContentArticlesTableTranslations;
      actions: AdminContentArticlesActionsTranslations;
      publicationValidation: AdminContentArticlePublicationValidationTranslations;
      toast: AdminContentArticlesToastTranslations;
      statusLabels: AdminContentArticleStatusLabelTranslations;
    }>('adminContentArticles', {
      page: 'page',
      filters: 'filters',
      table: 'table',
      actions: 'actions',
      publicationValidation: 'publicationValidation',
      toast: 'toast',
      statusLabels: 'statusLabels',
    });

  return {
    page,
    filters,
    table,
    actions,
    publicationValidation,
    toast,
    statusLabels,
    commonActions: createCommonActionsI18n(),
    commonEmpty: createCommonEmptyI18n(),
    commonErrors: createCommonErrorsI18n(),
    commonLabels: createCommonLabelsI18n(),
    commonNav: createCommonNavI18n(),
    commonStatus: createCommonStatusI18n(),
    commonTable: createCommonTableI18n(),
    commonValues: createCommonValuesI18n(),
  };
}
