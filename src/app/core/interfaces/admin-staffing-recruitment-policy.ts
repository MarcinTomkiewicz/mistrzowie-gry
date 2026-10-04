import { StaffingSessionSelectionMode, StaffingStationaryScopePolicy } from '../types/staffing-realization';

export interface AdminStaffingRecruitmentPolicy {
  realizationId: string;
  selfApplicationEnabled: boolean;
  stationaryScopePolicy: StaffingStationaryScopePolicy | null;
  sessionSelectionMode: StaffingSessionSelectionMode;
  sessionsRequiredAtApplication: boolean;
  requiredSessionMappingsPerSlot: number | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type SaveAdminStaffingRecruitmentPolicyPayload = Omit<
  AdminStaffingRecruitmentPolicy,
  'realizationId' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'
>;
