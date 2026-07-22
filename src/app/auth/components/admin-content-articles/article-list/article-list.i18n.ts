import {
  createCommonActionsI18n,
  createCommonStatusI18n,
  createCommonTableI18n,
  createCommonValuesI18n,
} from '../../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import {
  AdminContentArticlesActionsTranslations,
  AdminContentArticlePublicationValidationTranslations,
  AdminContentArticleStatusLabelTranslations,
  AdminContentArticlesPageTranslations,
  AdminContentArticlesTableTranslations,
  AdminContentArticlesToastTranslations,
} from '../../../../core/types/i18n/admin-content-articles';

export function createAdminContentArticleListI18n() {
  const { page, table, actions, publicationValidation, toast, statusLabels } =
    createScopedSectionsI18n<{
      page: AdminContentArticlesPageTranslations;
      table: AdminContentArticlesTableTranslations;
      actions: AdminContentArticlesActionsTranslations;
      publicationValidation: AdminContentArticlePublicationValidationTranslations;
      toast: AdminContentArticlesToastTranslations;
      statusLabels: AdminContentArticleStatusLabelTranslations;
    }>('adminContentArticles', {
      page: 'page',
      table: 'table',
      actions: 'actions',
      publicationValidation: 'publicationValidation',
      toast: 'toast',
      statusLabels: 'statusLabels',
    });

  return {
    page,
    table,
    actions,
    publicationValidation,
    toast,
    statusLabels,
    commonActions: createCommonActionsI18n(),
    commonStatus: createCommonStatusI18n(),
    commonTable: createCommonTableI18n(),
    commonValues: createCommonValuesI18n(),
  };
}
