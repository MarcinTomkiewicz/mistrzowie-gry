import type {
  StaffingRealizationReadinessIssueCode,
  StaffingRealizationReadinessSection,
} from '../types/staffing-realization-readiness';
import type { AdminStaffingRealizationCore } from './admin-staffing-realization';

export interface StaffingRealizationReadinessIssue {
  section: StaffingRealizationReadinessSection;
  code: StaffingRealizationReadinessIssueCode;
  field?: string;
  dayId?: string;
  slotId?: string;
}

export interface StaffingRealizationReadinessResult {
  realizationId: string;
  ready: boolean;
  issues: StaffingRealizationReadinessIssue[];
}

export interface OpenAdminStaffingRealizationResult {
  opened: boolean;
  realization: AdminStaffingRealizationCore;
  readiness: StaffingRealizationReadinessResult;
}
