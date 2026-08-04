import {
  createCommonActionsI18n,
  createCommonStatusI18n,
  createCommonValuesI18n,
} from '../../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import type {
  AdminCoworkerSigningSourceActionTranslations,
  AdminCoworkerSigningSourceErrorTranslations,
  AdminCoworkerSigningSourceFieldTranslations,
  AdminCoworkerSigningSourceMessageTranslations,
  AdminCoworkerSigningSourcePageTranslations,
  AdminCoworkerSigningSourceSectionTranslations,
  AdminCoworkerSigningSourceStatusTranslations,
  AdminCoworkerSigningSourceUploadTranslations,
} from '../../../../core/types/i18n/admin-coworker-signing-source';

export const ADMIN_COWORKER_SIGNING_SOURCES_SCOPE =
  'adminCoworkerSigningSources';

export function createAdminCoworkerSigningSourcesI18n() {
  const sections = createScopedSectionsI18n<{
    page: AdminCoworkerSigningSourcePageTranslations;
    sections: AdminCoworkerSigningSourceSectionTranslations;
    fields: AdminCoworkerSigningSourceFieldTranslations;
    actions: AdminCoworkerSigningSourceActionTranslations;
    statuses: AdminCoworkerSigningSourceStatusTranslations;
    upload: AdminCoworkerSigningSourceUploadTranslations;
    messages: AdminCoworkerSigningSourceMessageTranslations;
    errors: AdminCoworkerSigningSourceErrorTranslations;
  }>(ADMIN_COWORKER_SIGNING_SOURCES_SCOPE, {
    page: 'page',
    sections: 'sections',
    fields: 'fields',
    actions: 'actions',
    statuses: 'statuses',
    upload: 'upload',
    messages: 'messages',
    errors: 'errors',
  });

  return {
    ...sections,
    commonActions: createCommonActionsI18n(),
    commonStatus: createCommonStatusI18n(),
    commonValues: createCommonValuesI18n(),
  };
}
