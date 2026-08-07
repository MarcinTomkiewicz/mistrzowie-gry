export const COWORKER_ONBOARDING_LIFECYCLE_STATUSES = [
  'in_progress',
  'completed',
  'cancelled',
] as const;

export const COWORKER_DOCUMENT_LIFECYCLE_STATUSES = [
  'active',
  'archived',
] as const;

export const COWORKER_DOCUMENT_SCOPES = ['private', 'shared'] as const;

export const COWORKER_DOCUMENT_REQUIRED_ACTIONS = [
  'none',
  'upload_signed',
  'acknowledge',
] as const;

export const COWORKER_DOCUMENT_ASSIGNMENT_STATUSES = [
  'available',
  'pending',
  'submitted',
  'accepted',
  'rejected',
  'acknowledged',
  'revoked',
] as const;

export const COWORKER_DOCUMENT_SOURCES = ['uploaded', 'generated'] as const;

export const COWORKER_DOCUMENT_REVIEW_DECISIONS = [
  'accepted',
  'rejected',
] as const;

export const COWORKER_DOCUMENT_DOWNLOAD_TARGETS = [
  'source',
  'signed',
] as const;

export const COWORKER_DOCUMENT_API_ERROR_CODES = [
  'UNAUTHENTICATED',
  'ACCESS_DENIED',
  'VALIDATION_FAILED',
  'NOT_FOUND',
  'CONFLICT',
  'UPLOAD_FAILED',
  'INTERNAL_ERROR',
] as const;

export type CoworkerOnboardingLifecycleStatus =
  (typeof COWORKER_ONBOARDING_LIFECYCLE_STATUSES)[number];
export type CoworkerDocumentLifecycleStatus =
  (typeof COWORKER_DOCUMENT_LIFECYCLE_STATUSES)[number];
export type CoworkerDocumentScope =
  (typeof COWORKER_DOCUMENT_SCOPES)[number];
export type CoworkerDocumentRequiredAction =
  (typeof COWORKER_DOCUMENT_REQUIRED_ACTIONS)[number];
export type CoworkerDocumentAssignmentStatus =
  (typeof COWORKER_DOCUMENT_ASSIGNMENT_STATUSES)[number];
export type CoworkerDocumentSource =
  (typeof COWORKER_DOCUMENT_SOURCES)[number];
export type CoworkerDocumentReviewDecision =
  (typeof COWORKER_DOCUMENT_REVIEW_DECISIONS)[number];
export type CoworkerDocumentDownloadTarget =
  (typeof COWORKER_DOCUMENT_DOWNLOAD_TARGETS)[number];
export type CoworkerDocumentApiErrorCode =
  (typeof COWORKER_DOCUMENT_API_ERROR_CODES)[number];
