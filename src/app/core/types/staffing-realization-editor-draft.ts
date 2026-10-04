import { SaveAdminStaffingScheduleSlotInput } from '../interfaces/admin-staffing-realization';
import { SaveAdminStaffingTravelTermsPayload } from '../interfaces/admin-staffing-travel-terms';
import { StaffingRealizationType, StaffingWorkTimeScope } from './staffing-realization';

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

type StaffingTravelTermsTextField =
  | 'transportNote'
  | 'reimbursementNote'
  | 'lodgingNote'
  | 'workTimeNote'
  | 'travelNote';

export type StaffingRealizationTravelTermsDraft = Omit<
  SaveAdminStaffingTravelTermsPayload,
  StaffingTravelTermsTextField | 'workTimeScope'
> & Record<StaffingTravelTermsTextField, string> & {
  workTimeScope: StaffingWorkTimeScope | null;
};
