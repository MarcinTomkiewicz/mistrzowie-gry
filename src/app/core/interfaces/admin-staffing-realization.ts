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

export interface AdminStaffingRealizationDay {
  id: string;
  date: string;
  requiredGmCount: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface CreateAdminStaffingRealizationDayInput {
  date: string;
  requiredGmCount: number;
}

export interface SaveAdminStaffingRealizationDayInput
  extends CreateAdminStaffingRealizationDayInput {
  id?: string;
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
