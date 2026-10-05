import type {
  StaffingAvailabilityStatus,
  StaffingSlotAvailabilityStatus,
} from '../types/staffing-realization';

export interface AdminStaffingSlotAvailability {
  slotId: string;
  dayId: string;
  date: string;
  label: string;
  startTime: string;
  endTime: string;
  position: number;
  status: StaffingSlotAvailabilityStatus;
}

export interface AdminStaffingGmAvailability {
  userId: string;
  firstName: string | null;
  nickname: string | null;
  useNickname: boolean;
  status: StaffingAvailabilityStatus;
  slots: AdminStaffingSlotAvailability[];
}

export interface AdminStaffingAvailability {
  realizationId: string;
  timezone: string;
  slotCount: number;
  gms: AdminStaffingGmAvailability[];
}
