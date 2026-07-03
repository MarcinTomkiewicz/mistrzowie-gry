import {
  createCommonActionsI18n,
  createCommonStatusI18n,
} from '../../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import {
  AdminContentArticlesActionsTranslations,
  AdminContentArticleStatusLabelTranslations,
  AdminContentArticlesPageTranslations,
  AdminContentArticlesTableTranslations,
  AdminContentArticlesToastTranslations,
} from '../../../../core/types/i18n/admin-content-articles';

export function createAdminContentArticleListI18n() {
  const { page, table, actions, toast, statusLabels } =
    createScopedSectionsI18n<{
      page: AdminContentArticlesPageTranslations;
      table: AdminContentArticlesTableTranslations;
      actions: AdminContentArticlesActionsTranslations;
      toast: AdminContentArticlesToastTranslations;
      statusLabels: AdminContentArticleStatusLabelTranslations;
    }>('adminContentArticles', {
      page: 'page',
      table: 'table',
      actions: 'actions',
      toast: 'toast',
      statusLabels: 'statusLabels',
    });

  return {
    page,
    table,
    actions,
    toast,
    statusLabels,
    commonActions: createCommonActionsI18n(),
    commonStatus: createCommonStatusI18n(),
  };
}
