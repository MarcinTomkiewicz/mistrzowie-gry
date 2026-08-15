import {
  createCommonActionsI18n,
  createCommonErrorsI18n,
  createCommonNavI18n,
} from '../../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import type {
  CoworkerShellTabsTranslations,
  CoworkerShellTranslations,
} from '../../../../core/types/i18n/coworker-questionnaire';

export const COWORKER_SHELL_SCOPE = 'coworkerShell';

export function createCoworkerShellI18n() {
  const { shell, tabs } = createScopedSectionsI18n<{
    shell: CoworkerShellTranslations;
    tabs: CoworkerShellTabsTranslations;
  }>(COWORKER_SHELL_SCOPE, {
    shell: 'shell',
    tabs: 'tabs',
  });

  return {
    commonActions: createCommonActionsI18n(),
    commonErrors: createCommonErrorsI18n(),
    commonNav: createCommonNavI18n(),
    shell,
    tabs,
  };
}
