import {
  StaffingRealizationStatus,
  StaffingRealizationType,
} from '../types/staffing-realization';

export interface AdminStaffingRealizationCore {
  id: string;
  name: string;
  description: string | null;
  operationalNotes: string | null;
  city: string | null;
  venueName: string | null;
  venueAddress: string | null;
  timezone: string;
  type: StaffingRealizationType;
  status: StaffingRealizationStatus;
  coordinatorUserId: string;
  eventId: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AdminStaffingRealizationListItem {
  id: string;
  name: string;
  type: StaffingRealizationType;
  status: StaffingRealizationStatus;
  city: string | null;
  startDate: string | null;
  endDate: string | null;
  coordinatorUserId: string;
  staffingSummary: {
    required: number;
    confirmed: number;
    pending: number;
    vacancies: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdminStaffingRealizationDay {
  id: string;
  date: string;
  requiredGmCount: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AdminStaffingScheduleSlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  position: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AdminStaffingScheduleDay extends AdminStaffingRealizationDay {
  slots: AdminStaffingScheduleSlot[];
}

export interface AdminStaffingSchedule {
  realizationId: string;
  days: AdminStaffingScheduleDay[];
}

export interface CreateAdminStaffingRealizationDayInput {
  date: string;
  requiredGmCount: number;
}

export interface SaveAdminStaffingScheduleSlotInput {
  id?: string;
  label: string;
  startTime: string;
  endTime: string;
  position: number;
}

export interface SaveAdminStaffingScheduleDayInput
  extends CreateAdminStaffingRealizationDayInput {
  id?: string;
  slots: SaveAdminStaffingScheduleSlotInput[];
}

type AdminStaffingRealizationCoreInput = Pick<
  AdminStaffingRealizationCore,
  | 'name'
  | 'description'
  | 'operationalNotes'
  | 'city'
  | 'venueName'
  | 'venueAddress'
  | 'timezone'
  | 'type'
  | 'coordinatorUserId'
  | 'eventId'
>;

export interface CreateAdminStaffingRealizationRequest {
  name: string;
  description?: string | null;
  operationalNotes?: string | null;
  city?: string | null;
  venueName?: string | null;
  venueAddress?: string | null;
  timezone: string;
  type: StaffingRealizationType;
  coordinatorUserId?: string | null;
  eventId?: string | null;
  days: CreateAdminStaffingRealizationDayInput[];
}

export interface CreateAdminStaffingRealizationResult {
  realization: AdminStaffingRealizationCore;
  days: AdminStaffingRealizationDay[];
}

export type UpdateAdminStaffingRealizationCorePayload =
  AdminStaffingRealizationCoreInput;
