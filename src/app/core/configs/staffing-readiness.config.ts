import type { StaffingRealizationReadinessSection } from '../types/staffing-realization-readiness';

export const STAFFING_READINESS_SECTIONS: readonly StaffingRealizationReadinessSection[] = [
  'core', 'schedule', 'travel_terms', 'recruitment_policy',
];

export const STAFFING_READINESS_TAB_PATHS = {
  core: 'edit',
  schedule: 'schedule',
  travel_terms: 'travel-terms',
  recruitment_policy: 'recruitment-policy',
} as const satisfies Record<StaffingRealizationReadinessSection, string>;
