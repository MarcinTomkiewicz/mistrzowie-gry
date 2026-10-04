import {
  StaffingReimbursementMode,
  StaffingTransportMode,
  StaffingWorkTimeScope,
} from '../types/staffing-realization';

export interface AdminStaffingTravelTerms {
  realizationId: string;
  transportMode: StaffingTransportMode | null;
  transportNote: string | null;
  reimbursementMode: StaffingReimbursementMode | null;
  mileageRatePlnPerKm: number | null;
  reimbursementNote: string | null;
  lodgingProvided: boolean;
  lodgingNights: number | null;
  lodgingNote: string | null;
  breakfastProvided: boolean;
  lunchProvided: boolean;
  dinnerProvided: boolean;
  mealAllowanceApplicable: boolean;
  workTimeScope: StaffingWorkTimeScope;
  workTimeNote: string | null;
  travelNote: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type SaveAdminStaffingTravelTermsPayload = Omit<
  AdminStaffingTravelTerms,
  'realizationId' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'
>;
