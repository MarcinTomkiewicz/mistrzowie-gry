import { computed } from '@angular/core';

import {
  createCommonActionsI18n,
  createCommonFormI18n,
  createCommonStatusI18n,
  createCommonTableI18n,
} from './common.i18n';
import { createScopedSectionsI18n } from './scoped.i18n';
import type {
  CoworkerOnboardingActionsTranslations,
  CoworkerOnboardingAdminDetailTranslations,
  CoworkerOnboardingAdminListTranslations,
  CoworkerOnboardingAdminSharedTranslations,
  CoworkerOnboardingDialogsTranslations,
  CoworkerOnboardingFieldsTranslations,
  CoworkerOnboardingPrivateTranslations,
  CoworkerOnboardingSharedTranslations,
  CoworkerOnboardingStatusesTranslations,
  CoworkerOnboardingToastTranslations,
  CoworkerOnboardingUploadTranslations,
} from '../types/i18n/coworker-onboarding';

export const COWORKER_ONBOARDING_SCOPE = 'coworkerOnboarding';

export function createCoworkerOnboardingI18n() {
  const sections = createScopedSectionsI18n<{
    adminList: CoworkerOnboardingAdminListTranslations;
    adminDetail: CoworkerOnboardingAdminDetailTranslations;
    adminShared: CoworkerOnboardingAdminSharedTranslations;
    coworkerPrivate: CoworkerOnboardingPrivateTranslations;
    coworkerShared: CoworkerOnboardingSharedTranslations;
    fields: CoworkerOnboardingFieldsTranslations;
    actions: CoworkerOnboardingActionsTranslations;
    upload: CoworkerOnboardingUploadTranslations;
    dialogs: CoworkerOnboardingDialogsTranslations;
    toast: CoworkerOnboardingToastTranslations;
    statuses: CoworkerOnboardingStatusesTranslations;
  }>(COWORKER_ONBOARDING_SCOPE, {
    adminList: 'adminList',
    adminDetail: 'adminDetail',
    adminShared: 'adminShared',
    coworkerPrivate: 'coworkerPrivate',
    coworkerShared: 'coworkerShared',
    fields: 'fields',
    actions: 'actions',
    upload: 'upload',
    dialogs: 'dialogs',
    toast: 'toast',
    statuses: 'statuses',
  });

  const fileUploadTexts = computed(() => ({
    chooseLabel: sections.upload().choose,
    dropLabel: sections.upload().drop,
    formatsLabel: sections.upload().formats,
  }));

  return {
    ...sections,
    fileUploadTexts,
    commonActions: createCommonActionsI18n(),
    commonForm: createCommonFormI18n(),
    commonStatus: createCommonStatusI18n(),
    commonTable: createCommonTableI18n(),
  };
}
