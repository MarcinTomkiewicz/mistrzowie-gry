import type {
  CoworkerDocumentAssignmentStatus,
  CoworkerDocumentLifecycleStatus,
  CoworkerOnboardingLifecycleStatus,
} from '../coworker-onboarding';

export interface CoworkerOnboardingAdminListTranslations {
  title: string;
  subtitle: string;
  startTitle: string;
  startDescription: string;
  noCandidates: string;
  empty: string;
  loadError: string;
}

export interface CoworkerOnboardingAdminDetailTranslations {
  title: string;
  subtitle: string;
  userSection: string;
  documentsSection: string;
  uploadSection: string;
  completeSection: string;
  completeDescription: string;
  emptyDocuments: string;
  loadError: string;
  questionnaireBadge: string;
  rejectionReason: string;
}

export interface CoworkerOnboardingAdminSharedTranslations {
  title: string;
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
  title: string;
  subtitle: string;
  noOnboarding: string;
  questionnaireRequired: string;
  empty: string;
  declaration: string;
  rejectionReason: string;
  loadError: string;
}

export interface CoworkerOnboardingSharedTranslations {
  title: string;
  subtitle: string;
  onboardingRequired: string;
  empty: string;
  acknowledgedAt: string;
  loadError: string;
}

export interface CoworkerOnboardingFieldsTranslations {
  user: string;
  status: string;
  startedAt: string;
  completedAt: string;
  documents: string;
  pendingActions: string;
  title: string;
  preset: string;
  noPreset: string;
  requiresSignedUpload: string;
  version: string;
  assignments: string;
  pendingAssignments: string;
  acknowledgedAssignments: string;
  autoAssign: string;
  rejectionReason: string;
  acknowledgement: string;
}

export interface CoworkerOnboardingActionsTranslations {
  start: string;
  open: string;
  preview: string;
  download: string;
  previewSigned: string;
  downloadSigned: string;
  accept: string;
  reject: string;
  removeDocument: string;
  complete: string;
  addRow: string;
  uploadDocuments: string;
  uploadSigned: string;
  saveShared: string;
  replaceShared: string;
  archive: string;
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
  mutationSuccessDetail: string;
  mutationFailedSummary: string;
  mutationFailedDetail: string;
  downloadFailedSummary: string;
  downloadFailedDetail: string;
}

export interface CoworkerOnboardingStatusesTranslations {
  onboarding: Record<CoworkerOnboardingLifecycleStatus, string>;
  document: Record<CoworkerDocumentLifecycleStatus, string>;
  assignment: Record<CoworkerDocumentAssignmentStatus, string>;
}
