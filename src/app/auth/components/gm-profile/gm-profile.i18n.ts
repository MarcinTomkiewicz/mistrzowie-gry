import {
  createCommonActionsI18n,
  createCommonErrorsI18n,
  createCommonFormI18n,
  createCommonLabelsI18n,
  createCommonNavI18n,
  createCommonStatusI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  GmProfileActionsTranslations,
  GmProfileErrorsTranslations,
  GmProfileFormTranslations,
  GmProfileToastTranslations,
} from '../../../core/types/i18n/auth';

export function createGmProfileI18n() {
  const { form, errors, actions, toast } =
    createScopedSectionsI18n<{
      form: GmProfileFormTranslations;
      errors: GmProfileErrorsTranslations;
      actions: GmProfileActionsTranslations;
      toast: GmProfileToastTranslations;
    }>('auth', {
      form: 'gmProfile.form',
      errors: 'gmProfile.errors',
      actions: 'gmProfile.actions',
      toast: 'gmProfile.toast',
    });
  const commonActions = createCommonActionsI18n();
  const commonErrors = createCommonErrorsI18n();
  const commonForm = createCommonFormI18n();
  const commonStatus = createCommonStatusI18n();
  const commonLabels = createCommonLabelsI18n();

  return {
    commonNav: createCommonNavI18n(),
    form,
    errors,
    actions,
    toast,
    commonActions,
    commonErrors,
    commonForm,
    commonStatus,
    commonLabels,
  };
}
