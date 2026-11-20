import type {
  CoworkerDocumentApiErrorCode,
  CoworkerDocumentAssignmentStatus,
  CoworkerDocumentCategoryEventType,
  CoworkerDocumentRequiredAction,
  CoworkerOnboardingLifecycleStatus,
} from '../coworker-onboarding';

export interface CoworkerOnboardingAdminListTranslations {
  title: string;
  subtitle: string;
  empty: string;
  emptyVisible: string;
  loadError: string;
  filteredEmpty: string;
  notStarted: string;
  privateDocuments: string;
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
  documentSearch: string;
  hideRejected: string;
  emptyFilteredDocuments: string;
  title: string;
  subtitle: string;
  uploadSection: string;
  completeSection: string;
  completeDescription: string;
  emptyDocuments: string;
  loadError: string;
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
  empty: string;
  emptyConfirmations: string;
  loadError: string;
}

export interface CoworkerOnboardingCategoriesTranslations {
  label: string;
  all: string;
  add: string;
  rename: string;
  change: string;
  retired: string;
  retire: string;
  retireMessage: string;
  loadError: string;
  empty: string;
  history: string;
  historyLoadError: string;
  historyEmpty: string;
  events: Record<CoworkerDocumentCategoryEventType, string>;
}

export interface CoworkerOnboardingPrivateTranslations {
  subtitle: string;
  noOnboarding: string;
  questionnaireRequired: string;
  empty: string;
  declaration: string;
  loadError: string;
  searchByTitle: string;
  actionRequiredOnly: string;
  filteredEmpty: string;
  versionHistory: string;
  collapseUpload: string;
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
  document: string;
  documents: string;
  pendingActions: string;
  preset: string;
  noPreset: string;
  version: string;
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
  open: string;
  download: string;
  previewSigned: string;
  downloadSigned: string;
  accept: string;
  reject: string;
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
  cancelOnboardingMessage: string;
  archiveMessage: string;
}

export interface CoworkerOnboardingToastTranslations {
  mutationSuccessSummary: string;
  mutationFailedSummary: string;
  mutationFailedDetail: string;
  mutationUncertainSummary: string;
  mutationUncertainDetail: string;
  downloadFailedSummary: string;
  downloadFailedDetail: string;
  errors: Record<CoworkerDocumentApiErrorCode, string>;
}

export interface CoworkerOnboardingStatusesTranslations {
  onboarding: Record<CoworkerOnboardingLifecycleStatus, string>;
  assignment: Record<CoworkerDocumentAssignmentStatus, string>;
  pendingAcknowledgement: string;
  requiredAction: Record<CoworkerDocumentRequiredAction, string>;
}
