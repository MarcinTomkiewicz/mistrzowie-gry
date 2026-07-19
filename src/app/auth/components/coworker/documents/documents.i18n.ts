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
  }>('auth', {
    page: 'coworkerDocuments.page',
    sections: 'coworkerDocuments.sections',
    labels: 'coworkerDocuments.labels',
    actions: 'coworkerDocuments.actions',
    statuses: 'coworkerDocuments.statuses',
    errors: 'coworkerDocuments.errors',
    upload: 'coworkerDocuments.upload',
    confirmations: 'coworkerDocuments.confirmations',
  });

  return {
    ...sections,
    commonActions: createCommonActionsI18n(),
    commonEmpty: createCommonEmptyI18n(),
    commonStatus: createCommonStatusI18n(),
  };
}
