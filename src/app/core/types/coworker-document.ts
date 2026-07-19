export const COWORKER_SIGNATURE_DECLARATION_TYPES = [
  'unsigned',
  'handwritten',
  'trusted_profile',
  'qualified_electronic',
  'other_electronic',
  'unknown',
] as const;

export const COWORKER_PORTAL_DOCUMENT_STATUSES = [
  'draft',
  'submitted',
  'under_review',
  'accepted',
  'rejected',
  'withdrawn',
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

export const COWORKER_PORTAL_REQUIREMENT_STATUSES = [
  'pending',
  'submitted',
  'under_review',
  'needs_correction',
  'fulfilled',
  'waived',
  'expired',
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

export const COWORKER_AVAILABLE_DOCUMENT_ORIGIN_POLICIES = [
  'coworker_upload',
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

export const COWORKER_DOCUMENT_DOWNLOAD_ACTION =
  'downloadDocumentVersion' as const;

export type CoworkerSignatureDeclarationType =
  (typeof COWORKER_SIGNATURE_DECLARATION_TYPES)[number];
export type CoworkerPortalDocumentStatus =
  (typeof COWORKER_PORTAL_DOCUMENT_STATUSES)[number];
export type CoworkerDocumentVersionStatus =
  (typeof COWORKER_DOCUMENT_VERSION_STATUSES)[number];
export type CoworkerMalwareScanStatus =
  (typeof COWORKER_MALWARE_SCAN_STATUSES)[number];
export type CoworkerSignatureVerificationMethod =
  (typeof COWORKER_SIGNATURE_VERIFICATION_METHODS)[number];
export type CoworkerSignatureVerificationStatus =
  (typeof COWORKER_SIGNATURE_VERIFICATION_STATUSES)[number];
export type CoworkerVerifiedSignatureType =
  (typeof COWORKER_VERIFIED_SIGNATURE_TYPES)[number];
export type CoworkerPortalRequirementStatus =
  (typeof COWORKER_PORTAL_REQUIREMENT_STATUSES)[number];
export type CoworkerActiveOnboardingStatus =
  (typeof COWORKER_ACTIVE_ONBOARDING_STATUSES)[number];
export type CoworkerDocumentOriginPolicy =
  (typeof COWORKER_DOCUMENT_ORIGIN_POLICIES)[number];
export type CoworkerAvailableDocumentOriginPolicy =
  (typeof COWORKER_AVAILABLE_DOCUMENT_ORIGIN_POLICIES)[number];
export type CoworkerDocumentMultiplicity =
  (typeof COWORKER_DOCUMENT_MULTIPLICITIES)[number];
export type CoworkerNotificationSeverity =
  (typeof COWORKER_NOTIFICATION_SEVERITIES)[number];
export type CoworkerNotificationEntityType =
  (typeof COWORKER_NOTIFICATION_ENTITY_TYPES)[number];
export type CoworkerDocumentDownloadAction =
  typeof COWORKER_DOCUMENT_DOWNLOAD_ACTION;
