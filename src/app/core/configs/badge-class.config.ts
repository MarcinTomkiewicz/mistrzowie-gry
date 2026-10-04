import {
  CoworkerDocumentAssignmentStatus,
  CoworkerDocumentLifecycleStatus,
  CoworkerOnboardingLifecycleStatus,
} from '../types/coworker-onboarding';
import type { StaffingRealizationStatus } from '../types/staffing-realization';

export const STATUS_BADGE_CLASS = {
  draft: 'tag-badge--warn',
  open: 'tag-badge--success',
  closed: 'tag-badge--muted',
  pending: 'tag-badge--warn',
  in_progress: 'tag-badge--info',
  completed: 'tag-badge--success',
  active: 'tag-badge--success',
  available: 'tag-badge--info',
  submitted: 'tag-badge--info',
  cancelled: 'tag-badge--muted',
  accepted: 'tag-badge--success',
  acknowledged: 'tag-badge--success',
  revoked: 'tag-badge--muted',
  rejected: 'tag-badge--danger',
  archived: 'tag-badge--muted',
} as const satisfies Record<
  | CoworkerOnboardingLifecycleStatus
  | CoworkerDocumentLifecycleStatus
  | CoworkerDocumentAssignmentStatus
  | StaffingRealizationStatus,
  string
>;
