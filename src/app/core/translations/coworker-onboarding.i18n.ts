import { computed } from '@angular/core';

import {
  createCommonActionsI18n,
  createCommonEntityStatusesI18n,
  createCommonErrorsI18n,
  createCommonFormI18n,
  createCommonLabelsI18n,
  createCommonNavI18n,
  createCommonStatusI18n,
  createCommonTableI18n,
  createCommonValuesI18n,
} from './common.i18n';
import { createScopedSectionsI18n } from './scoped.i18n';
import type {
  CoworkerOnboardingActionsTranslations,
  CoworkerOnboardingAdminDetailTranslations,
  CoworkerOnboardingAdminListTranslations,
  CoworkerOnboardingAdminSharedTranslations,
  CoworkerOnboardingCategoriesTranslations,
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
    categories: CoworkerOnboardingCategoriesTranslations;
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
    categories: 'categories',
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
    commonEntityStatuses: createCommonEntityStatusesI18n(),
    commonErrors: createCommonErrorsI18n(),
    commonForm: createCommonFormI18n(),
    commonLabels: createCommonLabelsI18n(),
    commonNav: createCommonNavI18n(),
    commonStatus: createCommonStatusI18n(),
    commonTable: createCommonTableI18n(),
    commonValues: createCommonValuesI18n(),
  };
}
