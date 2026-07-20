import { createCommonStatusI18n } from '../../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import { CoworkerOperationalCopy } from '../../../../core/types/i18n/coworker-operational-document';

export function createOperationalDocumentsI18n() {
  const sections = createScopedSectionsI18n<CoworkerOperationalCopy>('auth', {
    page: 'coworkerOperationalDocuments.page',
    process: 'coworkerOperationalDocuments.process',
    sections: 'coworkerOperationalDocuments.sections',
    fields: 'coworkerOperationalDocuments.fields',
    actions: 'coworkerOperationalDocuments.actions',
    tooltips: 'coworkerOperationalDocuments.tooltips',
    statuses: 'coworkerOperationalDocuments.statuses',
    messages: 'coworkerOperationalDocuments.messages',
    dialog: 'coworkerOperationalDocuments.dialog',
    errors: 'coworkerOperationalDocuments.errors',
    notifications: 'coworkerOperationalDocuments.notifications',
  });

  return {
    ...sections,
    commonStatus: createCommonStatusI18n(),
    contextHelpLabel(subject: string): string {
      return `${sections.actions().showExplanation}: ${subject}`;
    },
  };
}
