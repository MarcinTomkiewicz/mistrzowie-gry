import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import type {
  AdminCoworkerShellTabsTranslations,
  AdminCoworkerShellTranslations,
} from '../../../../core/types/i18n/admin-coworker-shell';

export const ADMIN_COWORKER_SHELL_SCOPE = 'adminCoworkerShell';

export function createAdminCoworkerShellI18n() {
  const { shell, tabs } = createScopedSectionsI18n<{
    shell: AdminCoworkerShellTranslations;
    tabs: AdminCoworkerShellTabsTranslations;
  }>(ADMIN_COWORKER_SHELL_SCOPE, {
    shell: 'shell',
    tabs: 'tabs',
  });

  return {
    shell,
    tabs,
  };
}
