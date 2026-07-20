import {
  createCommonActionsI18n,
  createCommonEmptyI18n,
  createCommonFormI18n,
  createCommonStatusI18n,
} from '../../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import {
  AdminCoworkerDocActionCopy,
  AdminCoworkerDocErrorCopy,
  AdminCoworkerDocFieldCopy,
  AdminCoworkerDocMessageCopy,
  AdminCoworkerDocOptionCopy,
  AdminCoworkerDocPageCopy,
  AdminCoworkerDocSectionCopy,
  AdminCoworkerDocStatusCopy,
} from '../../../../core/types/i18n/admin-coworker-document';

export function createAdminCoworkerDocumentsI18n() {
  const { page, sections, fields, actions, statuses, options, messages, errors } =
    createScopedSectionsI18n<{
      page: AdminCoworkerDocPageCopy;
      sections: AdminCoworkerDocSectionCopy;
      fields: AdminCoworkerDocFieldCopy;
      actions: AdminCoworkerDocActionCopy;
      statuses: AdminCoworkerDocStatusCopy;
      options: AdminCoworkerDocOptionCopy;
      messages: AdminCoworkerDocMessageCopy;
      errors: AdminCoworkerDocErrorCopy;
    }>('adminCoworkerDocuments', {
      page: 'page',
      sections: 'sections',
      fields: 'fields',
      actions: 'actions',
      statuses: 'statuses',
      options: 'options',
      messages: 'messages',
      errors: 'errors',
    });

  return {
    page,
    sections,
    fields,
    actions,
    statuses,
    options,
    messages,
    errors,
    commonActions: createCommonActionsI18n(),
    commonEmpty: createCommonEmptyI18n(),
    commonForm: createCommonFormI18n(),
    commonStatus: createCommonStatusI18n(),
  };
}
