import {
  createCommonActionsI18n,
  createCommonCtaI18n,
  createCommonNavI18n,
} from '../../../core/translations/common.i18n';
import { createScopedObjectI18n } from '../../../core/translations/scoped.i18n';
import { UserMenuTranslations } from '../../../core/types/i18n/auth';

export function createUserMenuPanelI18n() {
  const userMenu = createScopedObjectI18n<UserMenuTranslations>(
    'auth',
    'userMenu',
  );
  const commonActions = createCommonActionsI18n();
  const commonCta = createCommonCtaI18n();
  const commonNav = createCommonNavI18n();

  return {
    userMenu,
    commonActions,
    commonCta,
    commonNav,
  };
}
