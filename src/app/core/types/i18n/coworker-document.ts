import {
  CoworkerActiveOnboardingStatus,
  CoworkerDocumentMultiplicity,
  CoworkerDocumentOriginPolicy,
  CoworkerDocumentRequirementStatus,
  CoworkerDocumentStatus,
  CoworkerDocumentVersionStatus,
  CoworkerMalwareScanStatus,
  CoworkerNotificationEntityType,
  CoworkerNotificationSeverity,
  CoworkerSignatureDeclarationType,
  CoworkerSignatureVerificationStatus,
  CoworkerVerifiedSignatureType,
} from '../coworker-document';

export type CoworkerDocumentsPageTranslations = {
  title: string;
  subtitle: string;
};

export type CoworkerDocumentsSectionTranslations = {
  onboardingTitle: string;
  requirementsTitle: string;
  requirementsDescription: string;
  unassignedTitle: string;
  unassignedDescription: string;
  definitionsTitle: string;
  definitionsDescription: string;
  versionsTitle: string;
  notificationsTitle: string;
  notificationsDescription: string;
};

export type CoworkerDocumentsLabelTranslations = {
  accessGrantedAt: string;
  onboardingOpenedAt: string;
  required: string;
  optional: string;
  deadline: string;
  late: string;
  waiverReason: string;
  rejectionReason: string;
  documentFallback: string;
  requirementDocuments: string;
  currentVersion: string;
  historicalVersion: string;
  versionNumber: string;
  signatureDeclaration: string;
  signatureVerification: string;
  verificationReason: string;
  malwareScan: string;
  uploadedAt: string;
  createdAt: string;
  allowedExtensions: string;
  allowedMimeTypes: string;
  signaturePolicy: string;
  allowedDeclarations: string;
  signatureRequired: string;
  signatureNotRequired: string;
  uploadSource: string;
  documentMultiplicity: string;
  requiredByDefault: string;
  downloadUnavailable: string;
  unreadNotifications: string;
  notificationRead: string;
  notificationUnread: string;
  notificationCreatedAt: string;
  notificationTechnicalCode: string;
};

export type CoworkerDocumentsActionTranslations = {
  download: string;
  reload: string;
  addDocument: string;
  addVersion: string;
  submitDocument: string;
  withdrawDocument: string;
  markNotificationRead: string;
  showRules: string;
  hideRules: string;
};

export type CoworkerDocumentsErrorTranslations = {
  loadTitle: string;
  loadDescription: string;
  sessionTitle: string;
  sessionDescription: string;
  unauthorizedTitle: string;
  unauthorizedDescription: string;
  downloadTitle: string;
  downloadNotFound: string;
  downloadConflict: string;
  storageError: string;
  invalidDownloadResponse: string;
  actionTitle: string;
  actionDescription: string;
  conflictDescription: string;
  unexpectedDescription: string;
  codeLabel: string;
  statusLabel: string;
};

export type CoworkerDocumentsStatusTranslations = {
  requirements: Record<CoworkerDocumentRequirementStatus, string>;
  documents: Record<CoworkerDocumentStatus, string>;
  versions: Record<CoworkerDocumentVersionStatus, string>;
  malware: Record<CoworkerMalwareScanStatus, string>;
  verification: Record<CoworkerSignatureVerificationStatus, string>;
  onboarding: Record<CoworkerActiveOnboardingStatus, string>;
  signatures: Record<CoworkerSignatureDeclarationType, string>;
  verifiedSignatures: Record<CoworkerVerifiedSignatureType, string>;
  origins: Record<CoworkerDocumentOriginPolicy, string>;
  multiplicities: Record<CoworkerDocumentMultiplicity, string>;
  notificationSeverities: Record<CoworkerNotificationSeverity, string>;
  notificationEntities: Record<CoworkerNotificationEntityType, string>;
};

export type CoworkerDocumentsUploadTranslations = {
  titleLabel: string;
  signatureLabel: string;
  signaturePlaceholder: string;
  signatureRequired: string;
  chooseFile: string;
  dropFile: string;
  reserving: string;
  uploading: string;
  finalizing: string;
  reserveError: string;
  uploadError: string;
  finalizeError: string;
  mismatchError: string;
  cancelError: string;
  cleanupError: string;
};

export type CoworkerDocumentConfirmTranslations = {
  submit: string;
  withdraw: string;
  replace: string;
};
