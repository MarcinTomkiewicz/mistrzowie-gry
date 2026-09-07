import {
  createCommonErrorsI18n,
  createCommonFormI18n,
  createCommonLabelsI18n,
  createCommonStatusI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  LoginFormActionsTranslations,
  LoginFormErrorsTranslations,
  LoginFormTitleTranslations,
  LoginFormToastTranslations,
} from '../../../core/types/i18n/auth';

export function createLoginFormI18n() {
  const { title, actions, errors, toast } = createScopedSectionsI18n<{
    title: LoginFormTitleTranslations;
    actions: LoginFormActionsTranslations;
    errors: LoginFormErrorsTranslations;
    toast: LoginFormToastTranslations;
  }>('auth', {
    title: 'loginForm.title',
    actions: 'loginForm.actions',
    errors: 'loginForm.errors',
    toast: 'loginForm.toast',
  });
  const commonErrors = createCommonErrorsI18n();
  const commonForm = createCommonFormI18n();
  const commonLabels = createCommonLabelsI18n();

  return {
    title,
    actions,
    errors,
    toast,
    commonErrors,
    commonForm,
    commonLabels,
    commonStatus: createCommonStatusI18n(),
  };
}
