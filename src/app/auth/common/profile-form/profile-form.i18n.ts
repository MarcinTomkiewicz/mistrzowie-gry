import {
  createCommonActionsI18n,
  createCommonCtaI18n,
  createCommonErrorsI18n,
  createCommonFormI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  ProfileFormActionsTranslations,
  ProfileFormErrorsTranslations,
  ProfileFormSuccessTranslations,
  ProfileFormTitleTranslations,
  ProfileFormToastTranslations,
  ProfileFormTranslations,
} from '../../../core/types/i18n/auth';

export function createProfileFormI18n() {
  const { title, form, errors, toast, success, actions } =
    createScopedSectionsI18n<{
      title: ProfileFormTitleTranslations;
      form: ProfileFormTranslations;
      errors: ProfileFormErrorsTranslations;
      toast: ProfileFormToastTranslations;
      success: ProfileFormSuccessTranslations;
      actions: ProfileFormActionsTranslations;
    }>('auth', {
      title: 'profileForm.title',
      form: 'profileForm.form',
      errors: 'profileForm.errors',
      toast: 'profileForm.toast',
      success: 'profileForm.success',
      actions: 'profileForm.actions',
    });
  const commonActions = createCommonActionsI18n();
  const commonCta = createCommonCtaI18n();
  const commonErrors = createCommonErrorsI18n();
  const commonForm = createCommonFormI18n();

  return {
    title,
    form,
    errors,
    toast,
    success,
    actions,
    commonActions,
    commonCta,
    commonErrors,
    commonForm,
  };
}
