import {
  createCommonActionsI18n,
  createCommonStatusI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  MyWorkLogActionsTranslations,
  MyWorkLogDialogTranslations,
  MyWorkLogFormTranslations,
  MyWorkLogToastTranslations,
  MyWorkLogTranslations,
} from '../../../core/types/i18n/auth';

export const MY_WORK_LOG_SCOPE = 'myWorkLog';

export function createMyWorkLogI18n() {
  const { myWorkLog, actions, form, dialog, toast } = createScopedSectionsI18n<{
    myWorkLog: MyWorkLogTranslations;
    actions: MyWorkLogActionsTranslations;
    form: MyWorkLogFormTranslations;
    dialog: MyWorkLogDialogTranslations;
    toast: MyWorkLogToastTranslations;
  }>(MY_WORK_LOG_SCOPE, {
    myWorkLog: 'page',
    actions: 'actions',
    form: 'form',
    dialog: 'dialog',
    toast: 'toast',
  });
  const commonActions = createCommonActionsI18n();
  const commonStatus = createCommonStatusI18n();

  return {
    myWorkLog,
    actions,
    form,
    dialog,
    toast,
    commonActions,
    commonStatus,
  };
}
