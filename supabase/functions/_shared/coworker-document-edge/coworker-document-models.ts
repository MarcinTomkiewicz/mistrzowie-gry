export const COWORKER_DOCUMENT_SIGNATURE_DECLARATION_TYPES = [
  "unsigned",
  "handwritten",
  "trusted_profile",
  "qualified_electronic",
  "other_electronic",
  "unknown",
] as const;

export const COWORKER_DOCUMENT_ORIGINS = [
  "system_generated",
  "coworker_upload",
  "admin_upload",
] as const;

export const COWORKER_DOCUMENT_ORIGIN_POLICIES = [
  "coworker_upload",
  "admin_upload",
  "system_generated",
  "mixed",
] as const;

export const COWORKER_DOCUMENT_MULTIPLICITIES = [
  "single",
  "multiple",
  "versioned_single",
] as const;

export const COWORKER_DOCUMENT_AUTOMATIC_VERIFICATION_MODES = [
  "disabled",
  "optional",
  "required",
] as const;

export const COWORKER_DOCUMENT_REQUIREMENT_STATUSES = [
  "pending",
  "submitted",
  "under_review",
  "needs_correction",
  "fulfilled",
  "waived",
  "expired",
  "cancelled",
] as const;

export const COWORKER_ACTIVE_ONBOARDING_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "needs_correction",
  "approved",
  "suspended",
] as const;

export const COWORKER_DOCUMENT_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "accepted",
  "rejected",
  "withdrawn",
  "archived",
] as const;

export const COWORKER_DOCUMENT_VERSION_STATUSES = [
  "reserved",
  "uploaded",
  "ready",
  "blocked",
  "failed",
  "superseded",
  "deleted",
] as const;

export const COWORKER_DOCUMENT_MALWARE_SCAN_STATUSES = [
  "not_scanned",
  "pending",
  "clean",
  "infected",
  "failed",
  "unavailable",
] as const;

export const COWORKER_DOCUMENT_VERIFICATION_METHODS = [
  "manual",
  "automatic",
  "external_provider",
] as const;

export const COWORKER_DOCUMENT_VERIFICATION_STATUSES = [
  "pending",
  "confirmed",
  "rejected",
  "indeterminate",
  "unsupported",
] as const;

export const COWORKER_DOCUMENT_VERIFIED_SIGNATURE_TYPES = [
  "handwritten",
  "trusted_profile",
  "qualified_electronic",
  "other_electronic",
  "unknown",
] as const;

export type CoworkerDocumentOrigin = typeof COWORKER_DOCUMENT_ORIGINS[number];
export type CoworkerDocumentStatus = typeof COWORKER_DOCUMENT_STATUSES[number];

export interface CoworkerSignaturePolicy {
  id: string;
  code: string;
  name: string;
  description: string | null;
  signatureRequired: boolean;
  allowedDeclarationTypes:
    typeof COWORKER_DOCUMENT_SIGNATURE_DECLARATION_TYPES[number][];
  manualReviewRequired: boolean;
  automaticVerificationMode:
    typeof COWORKER_DOCUMENT_AUTOMATIC_VERIFICATION_MODES[number];
  isActive: boolean;
}

export interface CoworkerDocumentDefinition {
  id: string;
  code: string;
  title: string;
  description: string | null;
  category: string;
  originPolicy: typeof COWORKER_DOCUMENT_ORIGIN_POLICIES[number];
  multiplicity: typeof COWORKER_DOCUMENT_MULTIPLICITIES[number];
  isRequiredByDefault: boolean;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  maxSizeBytes: number;
  retentionDays: number | null;
  isActive: boolean;
  activeFrom: string | null;
  activeUntil: string | null;
  signaturePolicy: CoworkerSignaturePolicy;
  createdAt: string;
  updatedAt: string;
}

export interface CoworkerOnboardingCase {
  id: string;
  userId: string;
  status: typeof COWORKER_ACTIVE_ONBOARDING_STATUSES[number];
  openedAt: string;
  submittedAt: string | null;
  reviewStartedAt: string | null;
  needsCorrectionAt: string | null;
  approvedAt: string | null;
  suspendedAt: string | null;
  closedAt: string | null;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface CoworkerDocumentSignatureVerification {
  id: string;
  verificationMethod: typeof COWORKER_DOCUMENT_VERIFICATION_METHODS[number];
  verificationStatus: typeof COWORKER_DOCUMENT_VERIFICATION_STATUSES[number];
  signatureType: typeof COWORKER_DOCUMENT_VERIFIED_SIGNATURE_TYPES[number];
  reason: string | null;
  createdAt: string;
}

export interface CoworkerDocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  status: typeof COWORKER_DOCUMENT_VERSION_STATUSES[number];
  originalFilename: string;
  fileExtension: string;
  declaredMimeType: string;
  detectedMimeType: string | null;
  expectedSizeBytes: number;
  sizeBytes: number | null;
  signatureDeclarationType:
    typeof COWORKER_DOCUMENT_SIGNATURE_DECLARATION_TYPES[number];
  signatureDeclaredAt: string | null;
  malwareScanStatus: typeof COWORKER_DOCUMENT_MALWARE_SCAN_STATUSES[number];
  uploadedAt: string | null;
  finalizedAt: string | null;
  supersededAt: string | null;
  retentionUntil: string | null;
  legalHold: boolean;
  latestSignatureVerification: CoworkerDocumentSignatureVerification | null;
  createdAt: string;
  updatedAt: string;
}

export interface CoworkerDocument {
  id: string;
  userId: string;
  onboardingCaseId: string | null;
  requirementId: string | null;
  documentDefinitionId: string;
  title: string | null;
  origin: CoworkerDocumentOrigin;
  status: CoworkerDocumentStatus;
  currentVersionId: string | null;
  currentVersion: CoworkerDocumentVersion | null;
  submittedVersionId: string | null;
  submittedVersion: CoworkerDocumentVersion | null;
  versions: CoworkerDocumentVersion[];
  submittedAt: string | null;
  reviewStartedAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  withdrawnAt: string | null;
  archivedAt: string | null;
  revision: number;
  createdAt: string;
  updatedAt: string;
}
