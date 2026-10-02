import { SaveAdminStaffingScheduleSlotInput } from '../interfaces/admin-staffing-realization';
import { StaffingRealizationType } from './staffing-realization';

export interface StaffingRealizationCoreDraft {
  name: string;
  description: string;
  operationalNotes: string;
  city: string;
  venueName: string;
  venueAddress: string;
  timezone: string;
  type: StaffingRealizationType;
  eventId: string | null;
}

export type StaffingRealizationSlotDraft = Omit<
  SaveAdminStaffingScheduleSlotInput,
  'id'
> & { id: string | null };

export interface StaffingRealizationDayDraft {
  id: string | null;
  date: Date | null;
  requiredGmCount: number;
  slots: StaffingRealizationSlotDraft[];
}
