import { computed } from '@angular/core';
import { translateObjectSignal } from '@jsverse/transloco';

import {
  CommonActionsTranslations,
  CommonErrorsTranslations,
  CommonFormTranslations,
  GmProfileActionsTranslations,
  GmProfileErrorsTranslations,
  GmProfileFormTranslations,
  GmProfileToastTranslations,
  GmProfileTranslations,
} from '../../../core/types/common-i18n';

export function createGmProfileI18n() {
  const gmProfileDict = translateObjectSignal('gmProfile', {}, { scope: 'auth' });
  const gmProfileFormDict = translateObjectSignal('gmProfile.form', {}, { scope: 'auth' });
  const gmProfileErrorsDict = translateObjectSignal('gmProfile.errors', {}, { scope: 'auth' });
  const gmProfileActionsDict = translateObjectSignal('gmProfile.actions', {}, { scope: 'auth' });
  const gmProfileToastDict = translateObjectSignal('gmProfile.toast', {}, { scope: 'auth' });

  const commonActionsDict = translateObjectSignal('actions', {}, { scope: 'common' });
  const commonErrorsDict = translateObjectSignal('errors', {}, { scope: 'common' });
  const commonFormDict = translateObjectSignal('form', {}, { scope: 'common' });

  const gmProfile = computed(() => gmProfileDict() as GmProfileTranslations);
  const form = computed(() => gmProfileFormDict() as GmProfileFormTranslations);
  const errors = computed(() => gmProfileErrorsDict() as GmProfileErrorsTranslations);
  const actions = computed(() => gmProfileActionsDict() as GmProfileActionsTranslations);
  const toast = computed(() => gmProfileToastDict() as GmProfileToastTranslations);

  const commonActions = computed(() => commonActionsDict() as CommonActionsTranslations);
  const commonErrors = computed(() => commonErrorsDict() as CommonErrorsTranslations);
  const commonForm = computed(() => commonFormDict() as CommonFormTranslations);

  return {
    gmProfile,
    form,
    errors,
    actions,
    toast,
    commonActions,
    commonErrors,
    commonForm,
  };
}