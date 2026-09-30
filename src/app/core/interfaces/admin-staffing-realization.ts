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

export type CreateAdminStaffingRealizationCorePayload = Omit<
  AdminStaffingRealizationCoreInput,
  'coordinatorUserId'
> & {
  coordinatorUserId?: string | null;
};

export type UpdateAdminStaffingRealizationCorePayload =
  AdminStaffingRealizationCoreInput;
