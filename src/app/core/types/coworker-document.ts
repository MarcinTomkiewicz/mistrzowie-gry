export const COWORKER_SIGNATURE_DECLARATION_TYPES = [
  'unsigned',
  'handwritten',
  'trusted_profile',
  'qualified_electronic',
  'other_electronic',
  'unknown',
] as const;

export const COWORKER_DOCUMENT_ORIGINS = [
  'system_generated',
  'coworker_upload',
  'admin_upload',
] as const;

export const COWORKER_DOCUMENT_STATUSES = [
  'draft',
  'submitted',
  'under_review',
  'accepted',
  'rejected',
  'withdrawn',
  'archived',
] as const;

export const COWORKER_DOCUMENT_VERSION_STATUSES = [
  'reserved',
  'uploaded',
  'ready',
  'blocked',
  'failed',
  'superseded',
  'deleted',
] as const;

export const COWORKER_MALWARE_SCAN_STATUSES = [
  'not_scanned',
  'pending',
  'clean',
  'infected',
  'failed',
  'unavailable',
] as const;

export const COWORKER_SIGNATURE_VERIFICATION_METHODS = [
  'manual',
  'automatic',
  'external_provider',
] as const;

export const COWORKER_SIGNATURE_VERIFICATION_STATUSES = [
  'pending',
  'confirmed',
  'rejected',
  'indeterminate',
  'unsupported',
] as const;

export const COWORKER_VERIFIED_SIGNATURE_TYPES = [
  'handwritten',
  'trusted_profile',
  'qualified_electronic',
  'other_electronic',
  'unknown',
] as const;

export const COWORKER_AUTOMATIC_VERIFICATION_MODES = [
  'disabled',
  'optional',
  'required',
] as const;

export const COWORKER_DOCUMENT_REQUIREMENT_STATUSES = [
  'pending',
  'submitted',
  'under_review',
  'needs_correction',
  'fulfilled',
  'waived',
  'expired',
  'cancelled',
] as const;

export const COWORKER_ACTIVE_ONBOARDING_STATUSES = [
  'draft',
  'submitted',
  'under_review',
  'needs_correction',
  'approved',
  'suspended',
] as const;

export const COWORKER_DOCUMENT_ORIGIN_POLICIES = [
  'coworker_upload',
  'admin_upload',
  'system_generated',
  'mixed',
] as const;

export const COWORKER_DOCUMENT_MULTIPLICITIES = [
  'single',
  'multiple',
  'versioned_single',
] as const;

export const COWORKER_NOTIFICATION_SEVERITIES = [
  'info',
  'success',
  'warning',
  'error',
] as const;

export const COWORKER_NOTIFICATION_ENTITY_TYPES = [
  'document',
  'document_requirement',
  'onboarding',
  'operational_document',
  'system',
] as const;

export const COWORKER_DOCUMENT_ACTION = {
  reserveUpload: 'reserveUpload',
  recoverUpload: 'recoverUpload',
  finalizeUpload: 'finalizeUpload',
  cancelUpload: 'cancelUpload',
  submitDocument: 'submitDocument',
  withdrawDocument: 'withdrawDocument',
  downloadDocumentVersion: 'downloadDocumentVersion',
  markNotificationRead: 'markNotificationRead',
  getDeletionCapabilities: 'getDeletionCapabilities',
  deleteDocumentVersion: 'deleteDocumentVersion',
  deleteDocument: 'deleteDocument',
} as const;

export const COWORKER_DOCUMENT_PRESERVATION_KINDS = [
  'historical',
  'permanent',
] as const;

export type SignatureDeclarationType =
  (typeof COWORKER_SIGNATURE_DECLARATION_TYPES)[number];
export type CoworkerDocumentOrigin =
  (typeof COWORKER_DOCUMENT_ORIGINS)[number];
export type CoworkerDocumentStatus =
  (typeof COWORKER_DOCUMENT_STATUSES)[number];
export type CoworkerDocumentVersionStatus =
  (typeof COWORKER_DOCUMENT_VERSION_STATUSES)[number];
export type MalwareScanStatus =
  (typeof COWORKER_MALWARE_SCAN_STATUSES)[number];
export type SignatureVerificationMethod =
  (typeof COWORKER_SIGNATURE_VERIFICATION_METHODS)[number];
export type SignatureVerificationStatus =
  (typeof COWORKER_SIGNATURE_VERIFICATION_STATUSES)[number];
export type VerifiedSignatureType =
  (typeof COWORKER_VERIFIED_SIGNATURE_TYPES)[number];
export type AutomaticVerificationMode =
  (typeof COWORKER_AUTOMATIC_VERIFICATION_MODES)[number];
export type CoworkerDocumentRequirementStatus =
  (typeof COWORKER_DOCUMENT_REQUIREMENT_STATUSES)[number];
export type CoworkerOnboardingStatus =
  (typeof COWORKER_ACTIVE_ONBOARDING_STATUSES)[number];
export type CoworkerDocumentOriginPolicy =
  (typeof COWORKER_DOCUMENT_ORIGIN_POLICIES)[number];
export type CoworkerDocumentMultiplicity =
  (typeof COWORKER_DOCUMENT_MULTIPLICITIES)[number];
export type CoworkerNotificationSeverity =
  (typeof COWORKER_NOTIFICATION_SEVERITIES)[number];
export type CoworkerNotificationEntityType =
  (typeof COWORKER_NOTIFICATION_ENTITY_TYPES)[number];
export type CoworkerDocumentAction =
  (typeof COWORKER_DOCUMENT_ACTION)[keyof typeof COWORKER_DOCUMENT_ACTION];
export type CoworkerDocumentUploadState =
  | 'idle'
  | 'reserving'
  | 'uploading'
  | 'finalizing';

export type CoworkerDocumentPreservationKind =
  (typeof COWORKER_DOCUMENT_PRESERVATION_KINDS)[number];

// Still consumed by UI scheduled for later lifecycle slices.
export type CoworkerSignatureDeclarationType = SignatureDeclarationType;
export type CoworkerMalwareScanStatus = MalwareScanStatus;
export type CoworkerSignatureVerificationMethod = SignatureVerificationMethod;
export type CoworkerSignatureVerificationStatus = SignatureVerificationStatus;
export type CoworkerVerifiedSignatureType = VerifiedSignatureType;
export type CoworkerAutomaticVerificationMode = AutomaticVerificationMode;
export type CoworkerActiveOnboardingStatus = CoworkerOnboardingStatus;

export type CoworkerDocumentActionRequest =
  | {
      readonly action: typeof COWORKER_DOCUMENT_ACTION.reserveUpload;
      readonly documentId: string | null;
      readonly requirementId: string | null;
      readonly documentDefinitionId: string | null;
      readonly onboardingCaseId: string | null;
      readonly originalFilename: string;
      readonly declaredMimeType: string;
      readonly sizeBytes: number;
      readonly signatureDeclarationType: SignatureDeclarationType;
      readonly title: string | null;
    }
  | {
      readonly action: typeof COWORKER_DOCUMENT_ACTION.recoverUpload;
      readonly uploadSessionId: string;
    }
  | {
      readonly action: typeof COWORKER_DOCUMENT_ACTION.finalizeUpload;
      readonly uploadSessionId: string;
    }
  | {
      readonly action: typeof COWORKER_DOCUMENT_ACTION.cancelUpload;
      readonly uploadSessionId: string;
    }
  | {
      readonly action: typeof COWORKER_DOCUMENT_ACTION.submitDocument;
      readonly documentId: string;
      readonly documentVersionId: string;
    }
  | {
      readonly action: typeof COWORKER_DOCUMENT_ACTION.withdrawDocument;
      readonly documentId: string;
    }
  | {
      readonly action: typeof COWORKER_DOCUMENT_ACTION.downloadDocumentVersion;
      readonly documentVersionId: string;
    }
  | {
      readonly action: typeof COWORKER_DOCUMENT_ACTION.markNotificationRead;
      readonly notificationId: string;
    }
  | {
      readonly action: typeof COWORKER_DOCUMENT_ACTION.getDeletionCapabilities;
      readonly documentId: string;
    }
  | {
      readonly action: typeof COWORKER_DOCUMENT_ACTION.deleteDocumentVersion;
      readonly documentId: string;
      readonly documentVersionId: string;
    }
  | {
      readonly action: typeof COWORKER_DOCUMENT_ACTION.deleteDocument;
      readonly documentId: string;
    };
