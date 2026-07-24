import {
  createCommonActionsI18n,
  createCommonAppRolesI18n,
  createCommonFormI18n,
  createCommonStatusI18n,
  createCommonValuesI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import { AdminOperationalCopy } from '../../../core/types/i18n/admin-coworker-operational-document';

export const OPERATIONAL_DOCUMENTS_ADMIN_SCOPE =
  'operational-documents-admin';

export function createAdminOperationalDocumentsI18n() {
  const sections = createScopedSectionsI18n<AdminOperationalCopy>(
    OPERATIONAL_DOCUMENTS_ADMIN_SCOPE,
    {
      page: 'page',
      process: 'process',
      sections: 'sections',
      fields: 'fields',
      actions: 'actions',
      tooltips: 'tooltips',
      statuses: 'statuses',
      messages: 'messages',
      errors: 'errors',
      validation: 'validation',
    },
  );

  return {
    ...sections,
    appRoles: createCommonAppRolesI18n(),
    commonActions: createCommonActionsI18n(),
    commonForm: createCommonFormI18n(),
    commonStatus: createCommonStatusI18n(),
    commonValues: createCommonValuesI18n(),
    contextHelpLabel(subject: string): string {
      return `${sections.actions().showExplanation}: ${subject}`;
    },
  };
}
