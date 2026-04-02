import { createCommonActionsI18n } from '../../../core/translations/common.i18n';
import { createScopedObjectI18n } from '../../../core/translations/scoped.i18n';
import { UserMenuTranslations } from '../../../core/types/i18n/auth';

export function createUserMenuPanelI18n() {
  const userMenu = createScopedObjectI18n<UserMenuTranslations>(
    'auth',
    'userMenu',
  );
  const commonActions = createCommonActionsI18n();

  return {
    userMenu,
    commonActions,
  };
}
