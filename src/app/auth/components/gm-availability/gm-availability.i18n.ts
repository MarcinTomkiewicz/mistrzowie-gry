import {
  createCommonActionsI18n,
  createCommonLabelsI18n,
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

export const GM_AVAILABILITY_SCOPE = 'gmAvailability';

export function createGmAvailabilityI18n() {
  const { gmAvailability, actions, form, dialog, toast } =
    createScopedSectionsI18n<{
      gmAvailability: GmAvailabilityTranslations;
      actions: GmAvailabilityActionsTranslations;
      form: GmAvailabilityFormTranslations;
      dialog: GmAvailabilityDialogTranslations;
      toast: GmAvailabilityToastTranslations;
    }>(GM_AVAILABILITY_SCOPE, {
      gmAvailability: 'page',
      actions: 'actions',
      form: 'form',
      dialog: 'dialog',
      toast: 'toast',
    });
  const commonActions = createCommonActionsI18n();
  const commonLabels = createCommonLabelsI18n();
  const commonStatus = createCommonStatusI18n();

  return {
    gmAvailability,
    actions,
    form,
    dialog,
    toast,
    commonActions,
    commonLabels,
    commonStatus,
  };
}
