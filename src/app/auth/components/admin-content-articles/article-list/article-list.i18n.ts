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
  AdminContentArticleEditorFieldsTranslations,
  AdminContentArticlePublicationValidationTranslations,
  AdminContentArticleStatusLabelTranslations,
  AdminContentArticlesPageTranslations,
  AdminContentArticlesTableTranslations,
  AdminContentArticlesToastTranslations,
} from '../../../../core/types/i18n/admin-content-articles';

export function createAdminContentArticleListI18n() {
  const {
    page,
    table,
    actions,
    fields,
    publicationValidation,
    toast,
    statusLabels,
  } =
    createScopedSectionsI18n<{
      page: AdminContentArticlesPageTranslations;
      table: AdminContentArticlesTableTranslations;
      actions: AdminContentArticlesActionsTranslations;
      fields: AdminContentArticleEditorFieldsTranslations;
      publicationValidation: AdminContentArticlePublicationValidationTranslations;
      toast: AdminContentArticlesToastTranslations;
      statusLabels: AdminContentArticleStatusLabelTranslations;
    }>('adminContentArticles', {
      page: 'page',
      table: 'table',
      actions: 'actions',
      fields: 'editorFields',
      publicationValidation: 'publicationValidation',
      toast: 'toast',
      statusLabels: 'statusLabels',
    });

  return {
    page,
    table,
    actions,
    fields,
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
