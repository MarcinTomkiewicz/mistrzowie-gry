import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import type {
  AdminCoworkerShellTabsTranslations,
  AdminCoworkerShellTranslations,
} from '../../../../core/types/i18n/auth';

export function createAdminCoworkerShellI18n() {
  const { shell, tabs } = createScopedSectionsI18n<{
    shell: AdminCoworkerShellTranslations;
    tabs: AdminCoworkerShellTabsTranslations;
  }>('auth', {
    shell: 'adminCoworkerShell',
    tabs: 'adminCoworkerShell.tabs',
  });

  return {
    shell,
    tabs,
  };
}
