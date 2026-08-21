import type {
  CoworkerDocumentAssignmentStatus,
  CoworkerOnboardingLifecycleStatus,
} from '../coworker-onboarding';

export interface CoworkerOnboardingAdminListTranslations {
  title: string;
  subtitle: string;
  startDescription: string;
  noCandidates: string;
  empty: string;
  loadError: string;
}

export interface CoworkerOnboardingAdminDetailTranslations {
  title: string;
  subtitle: string;
  uploadSection: string;
  completeSection: string;
  completeDescription: string;
  emptyDocuments: string;
  loadError: string;
  questionnaireBadge: string;
}

export interface CoworkerOnboardingAdminSharedTranslations {
  subtitle: string;
  formTitleNew: string;
  formTitleReplace: string;
  listTitle: string;
  confirmationsTitle: string;
  empty: string;
  emptyConfirmations: string;
  loadError: string;
}

export interface CoworkerOnboardingPrivateTranslations {
  subtitle: string;
  noOnboarding: string;
  questionnaireRequired: string;
  empty: string;
  declaration: string;
  loadError: string;
}

export interface CoworkerOnboardingSharedTranslations {
  subtitle: string;
  onboardingRequired: string;
  empty: string;
  acknowledgedAt: string;
}

export interface CoworkerOnboardingFieldsTranslations {
  startedAt: string;
  completedAt: string;
  documents: string;
  pendingActions: string;
  preset: string;
  noPreset: string;
  requiresSignedUpload: string;
  version: string;
  historicalVersion: string;
  assignments: string;
  pendingAssignments: string;
  acknowledgedAssignments: string;
  autoAssign: string;
  acknowledgement: string;
}

export interface CoworkerOnboardingActionsTranslations {
  start: string;
  open: string;
  download: string;
  previewSigned: string;
  downloadSigned: string;
  accept: string;
  reject: string;
  removeDocument: string;
  complete: string;
  uploadDocuments: string;
  uploadSigned: string;
  saveShared: string;
  replaceShared: string;
  showConfirmations: string;
  acknowledge: string;
  goToQuestionnaire: string;
}

export interface CoworkerOnboardingUploadTranslations {
  choose: string;
  drop: string;
  formats: string;
  selected: string;
  missingFile: string;
  contractPreset: string;
  annexPreset: string;
  protocolPreset: string;
}

export interface CoworkerOnboardingDialogsTranslations {
  rejectionTitle: string;
  rejectionDescription: string;
  removeMessage: string;
  completeMessage: string;
  archiveMessage: string;
}

export interface CoworkerOnboardingToastTranslations {
  mutationSuccessSummary: string;
  mutationFailedSummary: string;
  mutationFailedDetail: string;
  downloadFailedSummary: string;
  downloadFailedDetail: string;
}

export interface CoworkerOnboardingStatusesTranslations {
  onboarding: Record<CoworkerOnboardingLifecycleStatus, string>;
  assignment: Record<CoworkerDocumentAssignmentStatus, string>;
}
