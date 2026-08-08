import {
  createCommonActionsI18n,
  createCommonFormI18n,
  createCommonStatusI18n,
  createCommonTableI18n,
  createCommonValuesI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import type {
  AdminCommercialPagesDraftStatusTranslations,
  AdminCommercialPagesEditorPageTranslations,
  AdminCommercialPagesEditorToastTranslations,
  AdminCommercialPagesIdentityTranslations,
  AdminCommercialPagesKindTranslations,
  AdminCommercialPagesListPageTranslations,
  AdminCommercialPagesListTableTranslations,
  AdminCommercialPagesListToastTranslations,
  AdminCommercialPagesMetadataTranslations,
  AdminCommercialPagesSeoTranslations,
  AdminCommercialPagesTaxDisplayModeTranslations,
} from '../../../core/types/i18n/admin-commercial-pages';

export function createAdminCommercialPagesI18n() {
  const translations = createScopedSectionsI18n<{
    listPage: AdminCommercialPagesListPageTranslations;
    listTable: AdminCommercialPagesListTableTranslations;
    listToast: AdminCommercialPagesListToastTranslations;
    editorPage: AdminCommercialPagesEditorPageTranslations;
    editorToast: AdminCommercialPagesEditorToastTranslations;
    identity: AdminCommercialPagesIdentityTranslations;
    metadata: AdminCommercialPagesMetadataTranslations;
    seo: AdminCommercialPagesSeoTranslations;
    draftStatus: AdminCommercialPagesDraftStatusTranslations;
    kind: AdminCommercialPagesKindTranslations;
    taxDisplayMode: AdminCommercialPagesTaxDisplayModeTranslations;
  }>('adminCommercialPages', {
    listPage: 'list.page',
    listTable: 'list.table',
    listToast: 'list.toast',
    editorPage: 'editor.page',
    editorToast: 'editor.toast',
    identity: 'editor.identity',
    metadata: 'editor.metadata',
    seo: 'editor.seo',
    draftStatus: 'draftStatus',
    kind: 'kind',
    taxDisplayMode: 'taxDisplayMode',
  });

  return {
    ...translations,
    commonActions: createCommonActionsI18n(),
    commonForm: createCommonFormI18n(),
    commonStatus: createCommonStatusI18n(),
    commonTable: createCommonTableI18n(),
    commonValues: createCommonValuesI18n(),
  };
}
