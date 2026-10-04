import { StaffingSessionSelectionMode, StaffingStationaryScopePolicy } from '../types/staffing-realization';

export const STAFFING_STATIONARY_SCOPE_POLICIES = [
  'whole_realization', 'selected_days',
] as const satisfies readonly StaffingStationaryScopePolicy[];

export const STAFFING_SESSION_SELECTION_MODES = [
  'gm_selects', 'realization_assigns',
] as const satisfies readonly StaffingSessionSelectionMode[];
