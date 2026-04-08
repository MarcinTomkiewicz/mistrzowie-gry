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

export function createMyWorkLogI18n() {
  const { myWorkLog, actions, form, dialog, toast } = createScopedSectionsI18n<{
    myWorkLog: MyWorkLogTranslations;
    actions: MyWorkLogActionsTranslations;
    form: MyWorkLogFormTranslations;
    dialog: MyWorkLogDialogTranslations;
    toast: MyWorkLogToastTranslations;
  }>('auth', {
    myWorkLog: 'myWorkLog',
    actions: 'myWorkLog.actions',
    form: 'myWorkLog.form',
    dialog: 'myWorkLog.dialog',
    toast: 'myWorkLog.toast',
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
