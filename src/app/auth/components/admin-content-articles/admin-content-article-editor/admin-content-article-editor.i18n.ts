import {
  createCommonActionsI18n,
  createCommonStatusI18n,
} from '../../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import {
  AdminContentArticleEditorActionsTranslations,
  AdminContentArticleEditorFieldsTranslations,
  AdminContentArticleEditorPageTranslations,
  AdminContentArticleEditorToastTranslations,
  AdminContentArticleEditorValidationTranslations,
  AdminContentArticleStatusLabelTranslations,
} from '../../../../core/types/i18n/admin-content-articles';

export function createAdminContentArticleEditorI18n() {
  const {
    page,
    editorActions,
    fields,
    validation,
    toast,
    statusLabels,
  } = createScopedSectionsI18n<{
    page: AdminContentArticleEditorPageTranslations;
    editorActions: AdminContentArticleEditorActionsTranslations;
    fields: AdminContentArticleEditorFieldsTranslations;
    validation: AdminContentArticleEditorValidationTranslations;
    toast: AdminContentArticleEditorToastTranslations;
    statusLabels: AdminContentArticleStatusLabelTranslations;
  }>('adminContentArticles', {
    page: 'editorPage',
    editorActions: 'editorActions',
    fields: 'editorFields',
    validation: 'editorValidation',
    toast: 'editorToast',
    statusLabels: 'statusLabels',
  });

  return {
    page,
    editorActions,
    fields,
    validation,
    toast,
    statusLabels,
    commonActions: createCommonActionsI18n(),
    commonStatus: createCommonStatusI18n(),
  };
}
