import { computed } from '@angular/core';
import { translateObjectSignal } from '@jsverse/transloco';

import {
  CommonActionsTranslations,
  CommonCtaTranslations,
  CommonErrorsTranslations,
  CommonFormTranslations,
} from '../../../core/types/common-i18n';
import { pickTranslations } from '../../../core/utils/pick-translation';

export function createProfileFormI18n() {
  const titleDict = translateObjectSignal('profileForm.title', {}, { scope: 'auth' });
  const formDict = translateObjectSignal('profileForm.form', {}, { scope: 'auth' });
  const errorsDict = translateObjectSignal('profileForm.errors', {}, { scope: 'auth' });
  const toastDict = translateObjectSignal('profileForm.toast', {}, { scope: 'auth' });
  const successDict = translateObjectSignal('profileForm.success', {}, { scope: 'auth' });
  const actionsDict = translateObjectSignal('profileForm.actions', {}, { scope: 'auth' });

  const commonActionsDict = translateObjectSignal('actions', {}, { scope: 'common' });
  const commonCtaDict = translateObjectSignal('cta', {}, { scope: 'common' });
  const commonErrorsDict = translateObjectSignal('errors', {}, { scope: 'common' });
  const commonFormDict = translateObjectSignal('form', {}, { scope: 'common' });

  const commonActions = computed(
    () => commonActionsDict() as CommonActionsTranslations,
  );
  const commonCta = computed(
    () => commonCtaDict() as CommonCtaTranslations,
  );
  const commonErrors = computed(
    () => commonErrorsDict() as CommonErrorsTranslations,
  );
  const commonForm = computed(
    () => commonFormDict() as CommonFormTranslations,
  );

  const title = pickTranslations(titleDict, [
    'register',
    'edit',
  ] as const);

  const form = pickTranslations(formDict, [
    'emailLabel',
    'passwordLabel',
    'firstNameLabel',
    'nicknameLabel',
    'useNicknameLabel',
    'phoneNumberLabel',
    'cityLabel',
    'streetLabel',
    'houseNumberLabel',
    'apartmentNumberLabel',
    'postalCodeLabel',
    'ageLabel',
    'shortDescriptionLabel',
    'longDescriptionLabel',
    'extendedDescriptionLabel',
  ] as const);

  const errors = pickTranslations(errorsDict, [
    'displayNameRequired',
    'displayPreference',
    'emailAlreadyRegistered',
    'emailNotConfirmed',
    'weakPassword',
    'profileNotFound',
    'invalidCredentials',
  ] as const);

  const toast = pickTranslations(toastDict, [
    'invalidFormSummary',
    'registerFailedSummary',
    'registerSuccessSummary',
    'updateFailedSummary',
    'updateSuccessSummary',
    'confirmationRequiredSummary',
  ] as const);

  const success = pickTranslations(successDict, [
    'registered',
    'confirmationRequired',
    'updated',
  ] as const);

  const actions = pickTranslations(actionsDict, [
    'registerLabel',
    'updateLabel',
  ] as const);

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