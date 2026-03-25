import { computed } from '@angular/core';
import { translateObjectSignal } from '@jsverse/transloco';

import { CommonActionsTranslations } from '../../../core/types/common-i18n';

export interface UserMenuTranslations {
  greeting: string;
  accountSectionTitle: string;
  editProfileLabel: string;
}

export function createUserMenuPanelI18n() {
  const userMenuDict = translateObjectSignal('userMenu', {}, { scope: 'auth' });
  const commonActionsDict = translateObjectSignal('actions', {}, { scope: 'common' });

  const userMenu = computed(() => userMenuDict() as UserMenuTranslations);
  const commonActions = computed(() => commonActionsDict() as CommonActionsTranslations);

  return {
    userMenu,
    commonActions,
  };
}