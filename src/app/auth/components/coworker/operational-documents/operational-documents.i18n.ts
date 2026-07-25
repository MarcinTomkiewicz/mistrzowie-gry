import { createCommonStatusI18n } from '../../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import { CoworkerOperationalCopy } from '../../../../core/types/i18n/coworker-operational-document';

export const COWORKER_OPERATIONAL_DOCUMENTS_SCOPE =
  'coworkerOperationalDocuments';

export function createOperationalDocumentsI18n() {
  const sections =
    createScopedSectionsI18n<CoworkerOperationalCopy>(
      COWORKER_OPERATIONAL_DOCUMENTS_SCOPE,
      {
        page: 'page',
        process: 'process',
        sections: 'sections',
        fields: 'fields',
        actions: 'actions',
        tooltips: 'tooltips',
        statuses: 'statuses',
        messages: 'messages',
        dialog: 'dialog',
        errors: 'errors',
        notifications: 'notifications',
      },
    );

  return {
    ...sections,
    commonStatus: createCommonStatusI18n(),
    contextHelpLabel(subject: string): string {
      return `${sections.actions().showExplanation}: ${subject}`;
    },
  };
}
