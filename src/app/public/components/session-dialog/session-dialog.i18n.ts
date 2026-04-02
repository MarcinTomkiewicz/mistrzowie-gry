import { SessionDialogI18n } from '../../../core/types/i18n/common';
import { createCommonActionsI18n } from '../../../core/translations/common.i18n';

export function createSessionDialogI18n(): SessionDialogI18n {
  const actions = createCommonActionsI18n();

  return {
    actions,
  };
}
