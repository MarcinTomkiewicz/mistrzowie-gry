import type { StaffingAvailabilityStatus } from '../types/staffing-realization';

export const STAFFING_AVAILABILITY_BADGE_CLASS = {
  available: 'tag-badge--success',
  partial: 'tag-badge--warn',
  conflict: 'tag-badge--danger',
  no_declared_availability: 'tag-badge--muted',
  no_schedule: 'tag-badge--muted',
} as const satisfies Record<StaffingAvailabilityStatus, string>;
