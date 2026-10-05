import type { AdminStaffingAvailability } from './admin-staffing-availability';
import type { AdminStaffingRecruitmentPolicy } from './admin-staffing-recruitment-policy';
import type {
  AdminStaffingRealizationCore,
  AdminStaffingRealizationListItem,
  AdminStaffingSchedule,
} from './admin-staffing-realization';
import type { StaffingCandidate } from './staffing-candidate';

export interface AdminStaffingRealizationBoard {
  realization: AdminStaffingRealizationCore;
  summary: AdminStaffingRealizationListItem['staffingSummary'];
  schedule: AdminStaffingSchedule;
  candidates: StaffingCandidate[];
  availability: AdminStaffingAvailability;
  recruitmentPolicy: AdminStaffingRecruitmentPolicy | null;
}
