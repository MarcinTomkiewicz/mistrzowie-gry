import {
  createCommonActionsI18n,
  createCommonEmptyI18n,
  createCommonStatusI18n,
} from '../../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import {
  CoworkerDocumentsActionTranslations,
  CoworkerDocumentConfirmTranslations,
  CoworkerDocumentsErrorTranslations,
  CoworkerDocumentsLabelTranslations,
  CoworkerDocumentsPageTranslations,
  CoworkerDocumentsSectionTranslations,
  CoworkerDocumentsStatusTranslations,
  CoworkerDocumentsUploadTranslations,
} from '../../../../core/types/i18n/coworker-document';

export const COWORKER_DOCUMENTS_SCOPE = 'coworkerDocuments';

export function createDocumentsI18n() {
  const sections = createScopedSectionsI18n<{
    page: CoworkerDocumentsPageTranslations;
    sections: CoworkerDocumentsSectionTranslations;
    labels: CoworkerDocumentsLabelTranslations;
    actions: CoworkerDocumentsActionTranslations;
    statuses: CoworkerDocumentsStatusTranslations;
    errors: CoworkerDocumentsErrorTranslations;
    upload: CoworkerDocumentsUploadTranslations;
    confirmations: CoworkerDocumentConfirmTranslations;
  }>(COWORKER_DOCUMENTS_SCOPE, {
    page: 'page',
    sections: 'sections',
    labels: 'labels',
    actions: 'actions',
    statuses: 'statuses',
    errors: 'errors',
    upload: 'upload',
    confirmations: 'confirmations',
  });

  return {
    ...sections,
    commonActions: createCommonActionsI18n(),
    commonEmpty: createCommonEmptyI18n(),
    commonStatus: createCommonStatusI18n(),
  };
}
