import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import { CoworkerShellTranslations } from '../../../../core/types/i18n/coworker-questionnaire';

export function createCoworkerShellI18n() {
  return createScopedSectionsI18n<{
    shell: CoworkerShellTranslations;
  }>('auth', {
    shell: 'coworkerShell',
  });
}
