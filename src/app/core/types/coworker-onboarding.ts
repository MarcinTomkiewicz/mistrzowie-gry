export const COWORKER_DOCUMENT_REVIEW_DECISIONS = [
  'accepted',
  'rejected',
] as const;

export const COWORKER_DOCUMENT_DOWNLOAD_TARGETS = [
  'source',
  'signed',
] as const;

export type CoworkerOnboardingLifecycleStatus =
  | 'in_progress'
  | 'completed'
  | 'cancelled';
export type CoworkerDocumentLifecycleStatus = 'active' | 'archived';
export type CoworkerDocumentRequiredAction =
  | 'none'
  | 'upload_signed'
  | 'acknowledge';
export type CoworkerDocumentAssignmentStatus =
  | 'available'
  | 'pending'
  | 'submitted'
  | 'accepted'
  | 'rejected'
  | 'acknowledged'
  | 'revoked';
export type CoworkerDocumentSource = 'uploaded' | 'generated';
export type CoworkerDocumentReviewDecision =
  (typeof COWORKER_DOCUMENT_REVIEW_DECISIONS)[number];
export type CoworkerDocumentDownloadTarget =
  (typeof COWORKER_DOCUMENT_DOWNLOAD_TARGETS)[number];
export type CoworkerDocumentApiErrorCode =
  | 'UNAUTHENTICATED'
  | 'ACCESS_DENIED'
  | 'VALIDATION_FAILED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UPLOAD_FAILED'
  | 'INTERNAL_ERROR';
