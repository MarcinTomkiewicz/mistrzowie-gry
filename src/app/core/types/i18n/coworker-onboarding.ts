import type {
  CoworkerDocumentApiErrorCode,
  CoworkerDocumentCategoryEventType,
  CoworkerDocumentRequiredAction,
} from '../coworker-onboarding';

export interface CoworkerOnboardingAdminListTranslations {
  title: string;
  subtitle: string;
  notStarted: string;
  sharedDocuments: string;
  pendingActions: string;
  privateDocumentsHint: string;
  sharedDocumentsHint: string;
  filters: {
    searchLabel: string;
    allStatuses: string;
    pendingOnly: string;
    showCompleted: string;
  };
}

export interface CoworkerOnboardingAdminDetailTranslations {
  hideRejected: string;
  title: string;
  subtitle: string;
  uploadSection: string;
  completeDescription: string;
  questionnaireBadge: string;
  bulk: {
    selected: string;
    selectVisible: string;
    downloadOriginals: string;
    downloadSigned: string;
    missingSigned: string;
    zipProgress: string;
    zipFailed: string;
    categoryResult: string;
  };
}

export interface CoworkerOnboardingAdminSharedTranslations {
  subtitle: string;
  formTitleNew: string;
  formTitleReplace: string;
  listTitle: string;
  confirmationsTitle: string;
}

export interface CoworkerOnboardingCategoriesTranslations {
  all: string;
  add: string;
  rename: string;
  change: string;
  retire: string;
  retireMessage: string;
  history: string;
  events: Record<CoworkerDocumentCategoryEventType, string>;
}

export interface CoworkerOnboardingPrivateTranslations {
  subtitle: string;
  declaration: string;
  actionRequiredOnly: string;
  versionHistory: string;
  collapseUpload: string;
}

export interface CoworkerOnboardingSharedTranslations {
  subtitle: string;
}

export interface CoworkerOnboardingFieldsTranslations {
  startedAt: string;
  completedAt: string;
  pendingActions: string;
  preset: string;
  noPreset: string;
  historicalVersion: string;
  assignments: string;
  pendingAssignments: string;
  acknowledgedAssignments: string;
  autoAssign: string;
  acknowledgement: string;
  questionnaireExists: string;
  questionnaireComplete: string;
  questionnaireValidated: string;
  pendingSignatures: string;
  pendingAcknowledgements: string;
  awaitingAdminReview: string;
  requiredAction: string;
  defaultAction: string;
  noAssignment: string;
}

export interface CoworkerOnboardingActionsTranslations {
  start: string;
  previewSigned: string;
  downloadSigned: string;
  removeDocument: string;
  complete: string;
  cancelOnboarding: string;
  uploadDocuments: string;
  uploadSigned: string;
  saveShared: string;
  replaceShared: string;
  showConfirmations: string;
  acknowledge: string;
  acknowledgeDocument: string;
  goToQuestionnaire: string;
}

export interface CoworkerOnboardingUploadTranslations {
  contractPreset: string;
  annexPreset: string;
  protocolPreset: string;
}

export interface CoworkerOnboardingDialogsTranslations {
  rejectionTitle: string;
  rejectionDescription: string;
  removeMessage: string;
  completeMessage: string;
  cancelOnboardingMessage: string;
  archiveMessage: string;
}

export interface CoworkerOnboardingErrorsTranslations {
  load: {
    adminOnboardings: string;
    onboardingDetail: string;
    sharedDocuments: string;
    documentCategories: string;
    documentCategoryHistory: string;
    coworkerPrivateDocuments: string;
  };
  api: Record<
    Exclude<CoworkerDocumentApiErrorCode, 'UNAUTHENTICATED' | 'ACCESS_DENIED' | 'INTERNAL_ERROR'>,
    string
  >;
}

export interface CoworkerOnboardingEmptyStatesTranslations {
  adminOnboardings: string;
  visibleAdminOnboardings: string;
  filteredAdminOnboardings: string;
  adminPrivateDocuments: string;
  filteredDocuments: string;
  adminSharedDocuments: string;
  sharedDocumentConfirmations: string;
  documentCategories: string;
  documentCategoryHistory: string;
  coworkerOnboarding: string;
  privateDocumentsRequireQuestionnaire: string;
  coworkerPrivateDocuments: string;
  sharedDocumentsRequireCompletedOnboarding: string;
  coworkerSharedDocuments: string;
}

export interface CoworkerOnboardingToastTranslations {
  mutationSuccessSummary: string;
  mutationFailedSummary: string;
  mutationFailedDetail: string;
  mutationUncertainSummary: string;
  mutationUncertainDetail: string;
  downloadFailedSummary: string;
  downloadFailedDetail: string;
}

export interface CoworkerOnboardingStatusesTranslations {
  pendingAcknowledgement: string;
  requiredAction: Record<CoworkerDocumentRequiredAction, string>;
}
