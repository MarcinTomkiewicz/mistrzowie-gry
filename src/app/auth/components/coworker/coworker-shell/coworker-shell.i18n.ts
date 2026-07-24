import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import type {
  CoworkerShellTabsTranslations,
  CoworkerShellTranslations,
} from '../../../../core/types/i18n/coworker-questionnaire';

export function createCoworkerShellI18n() {
  const { shell, tabs } = createScopedSectionsI18n<{
    shell: CoworkerShellTranslations;
    tabs: CoworkerShellTabsTranslations;
  }>('auth', {
    shell: 'coworkerShell',
    tabs: 'coworkerShell.tabs',
  });

  return {
    shell,
    tabs,
  };
}
