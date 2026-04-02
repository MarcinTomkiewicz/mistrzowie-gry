import {
  createCommonErrorsI18n,
  createCommonFormI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  LoginFormActionsTranslations,
  LoginFormErrorsTranslations,
  LoginFormTitleTranslations,
  LoginFormTranslations,
} from '../../../core/types/i18n/auth';

export function createLoginFormI18n() {
  const { title, form, actions, errors } = createScopedSectionsI18n<{
    title: LoginFormTitleTranslations;
    form: LoginFormTranslations;
    actions: LoginFormActionsTranslations;
    errors: LoginFormErrorsTranslations;
  }>('auth', {
    title: 'loginForm.title',
    form: 'loginForm.form',
    actions: 'loginForm.actions',
    errors: 'loginForm.errors',
  });
  const commonErrors = createCommonErrorsI18n();
  const commonForm = createCommonFormI18n();

  return {
    title,
    form,
    actions,
    errors,
    commonErrors,
    commonForm,
  };
}
