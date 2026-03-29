import { computed } from '@angular/core';
import { translateObjectSignal } from '@jsverse/transloco';

import { CommonActionsTranslations, SessionDialogI18n } from '../../../core/types/common-i18n';

export function createSessionDialogI18n(): SessionDialogI18n {
  const actionsDict = translateObjectSignal('actions', {}, { scope: 'common' });

  const actions = computed(() => actionsDict() as CommonActionsTranslations);

  return {
    actions,
  };
}