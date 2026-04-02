import {
  createCommonActionsI18n,
  createCommonErrorsI18n,
  createCommonFormI18n,
  createCommonStatusI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  GmProfileActionsTranslations,
  GmProfileErrorsTranslations,
  GmProfileFormTranslations,
  GmProfileToastTranslations,
  GmProfileTranslations,
} from '../../../core/types/i18n/auth';

export function createGmProfileI18n() {
  const { gmProfile, form, errors, actions, toast } =
    createScopedSectionsI18n<{
      gmProfile: GmProfileTranslations;
      form: GmProfileFormTranslations;
      errors: GmProfileErrorsTranslations;
      actions: GmProfileActionsTranslations;
      toast: GmProfileToastTranslations;
    }>('auth', {
      gmProfile: 'gmProfile',
      form: 'gmProfile.form',
      errors: 'gmProfile.errors',
      actions: 'gmProfile.actions',
      toast: 'gmProfile.toast',
    });
  const commonActions = createCommonActionsI18n();
  const commonErrors = createCommonErrorsI18n();
  const commonForm = createCommonFormI18n();
  const commonStatus = createCommonStatusI18n();

  return {
    gmProfile,
    form,
    errors,
    actions,
    toast,
    commonActions,
    commonErrors,
    commonForm,
    commonStatus,
  };
}
