import {
  createCommonActionsI18n,
  createCommonStatusI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  GmAvailabilityActionsTranslations,
  GmAvailabilityDialogTranslations,
  GmAvailabilityFormTranslations,
  GmAvailabilityToastTranslations,
  GmAvailabilityTranslations,
} from '../../../core/types/i18n/auth';

export function createGmAvailabilityI18n() {
  const { gmAvailability, actions, form, dialog, toast } =
    createScopedSectionsI18n<{
      gmAvailability: GmAvailabilityTranslations;
      actions: GmAvailabilityActionsTranslations;
      form: GmAvailabilityFormTranslations;
      dialog: GmAvailabilityDialogTranslations;
      toast: GmAvailabilityToastTranslations;
    }>('auth', {
      gmAvailability: 'gmAvailability',
      actions: 'gmAvailability.actions',
      form: 'gmAvailability.form',
      dialog: 'gmAvailability.dialog',
      toast: 'gmAvailability.toast',
    });
  const commonActions = createCommonActionsI18n();
  const commonStatus = createCommonStatusI18n();

  return {
    gmAvailability,
    actions,
    form,
    dialog,
    toast,
    commonActions,
    commonStatus,
  };
}
