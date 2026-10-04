import {
  StaffingReimbursementMode,
  StaffingTransportMode,
  StaffingWorkTimeScope,
} from '../types/staffing-realization';

export const STAFFING_TRANSPORT_MODES = [
  'organizer_provided',
  'self_arranged',
  'mixed',
] as const satisfies readonly StaffingTransportMode[];

export const STAFFING_REIMBURSEMENT_MODES = [
  'none',
  'actual_cost',
  'mileage',
  'custom',
] as const satisfies readonly StaffingReimbursementMode[];

export const STAFFING_WORK_TIME_SCOPES = [
  'on_site_only',
  'including_travel',
  'custom',
] as const satisfies readonly StaffingWorkTimeScope[];
