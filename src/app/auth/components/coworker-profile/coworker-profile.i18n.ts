import {
  createCommonActionsI18n,
  createCommonStatusI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  CoworkerProfileActionsTranslations,
  CoworkerProfileFormTranslations,
  CoworkerProfileToastTranslations,
  CoworkerProfileTranslations,
} from '../../../core/types/i18n/auth';

export function createCoworkerProfileI18n() {
  const { coworkerProfile, form, actions, toast } = createScopedSectionsI18n<{
    coworkerProfile: CoworkerProfileTranslations;
    form: CoworkerProfileFormTranslations;
    actions: CoworkerProfileActionsTranslations;
    toast: CoworkerProfileToastTranslations;
  }>('auth', {
    coworkerProfile: 'coworkerProfile',
    form: 'coworkerProfile.form',
    actions: 'coworkerProfile.actions',
    toast: 'coworkerProfile.toast',
  });
  const commonActions = createCommonActionsI18n();
  const commonStatus = createCommonStatusI18n();

  return {
    coworkerProfile,
    form,
    actions,
    toast,
    commonActions,
    commonStatus,
  };
}
