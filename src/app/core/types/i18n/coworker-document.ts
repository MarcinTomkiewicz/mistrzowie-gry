import {
  CoworkerActiveOnboardingStatus,
  CoworkerAvailableDocumentOriginPolicy,
  CoworkerDocumentMultiplicity,
  CoworkerDocumentVersionStatus,
  CoworkerMalwareScanStatus,
  CoworkerPortalDocumentStatus,
  CoworkerPortalRequirementStatus,
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
  requiredByDefault: string;
  downloadUnavailable: string;
};

export type CoworkerDocumentsActionTranslations = {
  download: string;
  reload: string;
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
  unexpectedDescription: string;
  codeLabel: string;
  statusLabel: string;
};

export type CoworkerDocumentsStatusTranslations = {
  requirements: Record<CoworkerPortalRequirementStatus, string>;
  documents: Record<CoworkerPortalDocumentStatus, string>;
  versions: Record<CoworkerDocumentVersionStatus, string>;
  malware: Record<CoworkerMalwareScanStatus, string>;
  verification: Record<CoworkerSignatureVerificationStatus, string>;
  onboarding: Record<CoworkerActiveOnboardingStatus, string>;
  signatures: Record<CoworkerSignatureDeclarationType, string>;
  verifiedSignatures: Record<CoworkerVerifiedSignatureType, string>;
  origins: Record<CoworkerAvailableDocumentOriginPolicy, string>;
  multiplicities: Record<CoworkerDocumentMultiplicity, string>;
};
