import {
  CoworkerActiveOnboardingStatus,
  CoworkerDocumentVersionStatus,
  CoworkerMalwareScanStatus,
  CoworkerPortalDocumentStatus,
  CoworkerPortalRequirementStatus,
  CoworkerSignatureDeclarationType,
  CoworkerSignatureVerificationStatus,
} from '../types/coworker-document';

export const STATUS_BADGE_CLASS = {
  pending: 'tag-badge--warn',
  submitted: 'tag-badge--info',
  under_review: 'tag-badge--info',
  needs_correction: 'tag-badge--danger',
  fulfilled: 'tag-badge--success',
  waived: 'tag-badge--muted',
  expired: 'tag-badge--danger',
  draft: 'tag-badge--muted',
  accepted: 'tag-badge--success',
  rejected: 'tag-badge--danger',
  withdrawn: 'tag-badge--muted',
  approved: 'tag-badge--success',
  suspended: 'tag-badge--warn',
  reserved: 'tag-badge--muted',
  uploaded: 'tag-badge--info',
  ready: 'tag-badge--success',
  blocked: 'tag-badge--danger',
  failed: 'tag-badge--danger',
  superseded: 'tag-badge--muted',
  deleted: 'tag-badge--muted',
  not_scanned: 'tag-badge--muted',
  clean: 'tag-badge--success',
  infected: 'tag-badge--danger',
  unavailable: 'tag-badge--muted',
  confirmed: 'tag-badge--success',
  indeterminate: 'tag-badge--warn',
  unsupported: 'tag-badge--muted',
} as const satisfies Record<
  | CoworkerPortalRequirementStatus
  | CoworkerPortalDocumentStatus
  | CoworkerActiveOnboardingStatus
  | CoworkerDocumentVersionStatus
  | CoworkerMalwareScanStatus
  | CoworkerSignatureVerificationStatus,
  string
>;

export const SIGNATURE_BADGE_CLASS = {
  unsigned: 'tag-badge--muted',
  handwritten: 'tag-badge--info',
  trusted_profile: 'tag-badge--success',
  qualified_electronic: 'tag-badge--success',
  other_electronic: 'tag-badge--info',
  unknown: 'tag-badge--warn',
} as const satisfies Record<CoworkerSignatureDeclarationType, string>;
