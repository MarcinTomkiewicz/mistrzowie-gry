import { computed } from '@angular/core';

import {
  createCommonActionsI18n,
  createCommonEntityStatusesI18n,
  createCommonErrorsI18n,
  createCommonFormI18n,
  createCommonLabelsI18n,
  createCommonNavI18n,
  createCommonStatusI18n,
  createCommonStatusPhrasesI18n,
  createCommonTableI18n,
  createCommonValuesI18n,
} from './common.i18n';
import { createScopedSectionsI18n } from './scoped.i18n';
import type { CoworkerDocumentAssignmentStatus, CoworkerOnboardingLifecycleStatus } from '../types/coworker-onboarding';
import type {
  CoworkerOnboardingActionsTranslations,
  CoworkerOnboardingAdminDetailTranslations,
  CoworkerOnboardingAdminListTranslations,
  CoworkerOnboardingAdminSharedTranslations,
  CoworkerOnboardingCategoriesTranslations,
  CoworkerOnboardingDialogsTranslations,
  CoworkerOnboardingEmptyStatesTranslations,
  CoworkerOnboardingErrorsTranslations,
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
    loadErrors: CoworkerOnboardingErrorsTranslations['load'];
    apiErrors: CoworkerOnboardingErrorsTranslations['api'];
    emptyStates: CoworkerOnboardingEmptyStatesTranslations;
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
    loadErrors: 'errors.load',
    apiErrors: 'errors.api',
    emptyStates: 'emptyStates',
    toast: 'toast',
    statuses: 'statuses',
  });

  const fileUploadTexts = computed(() => ({
    chooseLabel: sections.upload().choose,
    dropLabel: sections.upload().drop,
    formatsLabel: sections.upload().formats,
  }));
  const commonEntityStatuses = createCommonEntityStatusesI18n();
  const commonStatusPhrases = createCommonStatusPhrasesI18n();
  const assignmentStatuses = computed<Record<CoworkerDocumentAssignmentStatus, string> | null>(() => {
    const { available, accepted, rejected, withdrawn } = commonEntityStatuses();
    const { requiresAction, submittedForReview, acknowledged } = commonStatusPhrases();
    if (!available || !accepted || !rejected || !withdrawn || !requiresAction || !submittedForReview || !acknowledged) {
      return null;
    }
    return {
      available: available.masculine,
      pending: requiresAction,
      submitted: submittedForReview,
      accepted: accepted.masculine,
      rejected: rejected.masculine,
      acknowledged,
      revoked: withdrawn.masculine,
    };
  });

  return {
    ...sections,
    assignmentStatuses,
    onboardingStatusLabel: (status: CoworkerOnboardingLifecycleStatus): string | null =>
      status === 'in_progress'
        ? commonStatusPhrases().inProgress ?? null
        : commonEntityStatuses()[status]?.neuter ?? null,
    fileUploadTexts,
    commonActions: createCommonActionsI18n(),
    commonEntityStatuses,
    commonStatusPhrases,
    commonErrors: createCommonErrorsI18n(),
    commonForm: createCommonFormI18n(),
    commonLabels: createCommonLabelsI18n(),
    commonNav: createCommonNavI18n(),
    commonStatus: createCommonStatusI18n(),
    commonTable: createCommonTableI18n(),
    commonValues: createCommonValuesI18n(),
  };
}
