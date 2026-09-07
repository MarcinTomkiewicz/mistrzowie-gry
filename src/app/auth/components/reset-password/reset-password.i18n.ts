import {
  createCommonActionsI18n,
  createCommonErrorsI18n,
  createCommonFormI18n,
  createCommonLabelsI18n,
  createCommonStatusI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  ProfileFormErrorsTranslations,
  ResetPasswordToastTranslations,
  ResetPasswordTranslations,
} from '../../../core/types/i18n/auth';

export function createResetPasswordI18n() {
  const { page, toast, profileErrors } = createScopedSectionsI18n<{
    page: ResetPasswordTranslations;
    toast: ResetPasswordToastTranslations;
    profileErrors: ProfileFormErrorsTranslations;
  }>('auth', {
    page: 'resetPassword.page',
    toast: 'resetPassword.toast',
    profileErrors: 'profileForm.errors',
  });

  return {
    page,
    toast,
    profileErrors,
    commonActions: createCommonActionsI18n(),
    commonErrors: createCommonErrorsI18n(),
    commonForm: createCommonFormI18n(),
    commonLabels: createCommonLabelsI18n(),
    commonStatus: createCommonStatusI18n(),
  };
}
