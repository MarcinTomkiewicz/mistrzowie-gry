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
  AdminCoworkerDocProcessCopy,
  AdminCoworkerDocSectionCopy,
  AdminCoworkerDocStatusCopy,
  AdminCoworkerDocTooltipCopy,
} from '../../../../core/types/i18n/admin-coworker-document';
import { AdminCoworkerDocReviewCopy } from '../../../../core/types/i18n/admin-coworker-document-review';

export function createAdminCoworkerDocumentsI18n() {
  const {
    page,
    sections,
    process,
    tooltips,
    fields,
    actions,
    statuses,
    options,
    messages,
    errors,
    review,
  } =
    createScopedSectionsI18n<{
      page: AdminCoworkerDocPageCopy;
      sections: AdminCoworkerDocSectionCopy;
      process: AdminCoworkerDocProcessCopy;
      tooltips: AdminCoworkerDocTooltipCopy;
      fields: AdminCoworkerDocFieldCopy;
      actions: AdminCoworkerDocActionCopy;
      statuses: AdminCoworkerDocStatusCopy;
      options: AdminCoworkerDocOptionCopy;
      messages: AdminCoworkerDocMessageCopy;
      errors: AdminCoworkerDocErrorCopy;
      review: AdminCoworkerDocReviewCopy;
    }>('adminCoworkerDocuments', {
      page: 'page',
      sections: 'sections',
      process: 'process',
      tooltips: 'tooltips',
      fields: 'fields',
      actions: 'actions',
      statuses: 'statuses',
      options: 'options',
      messages: 'messages',
      errors: 'errors',
      review: 'review',
    });

  function contextHelpLabel(subject: string): string {
    return `${actions().showExplanation}: ${subject}`;
  }

  return {
    page,
    sections,
    process,
    tooltips,
    fields,
    actions,
    statuses,
    options,
    messages,
    errors,
    review,
    contextHelpLabel,
    commonActions: createCommonActionsI18n(),
    commonEmpty: createCommonEmptyI18n(),
    commonForm: createCommonFormI18n(),
    commonStatus: createCommonStatusI18n(),
  };
}
