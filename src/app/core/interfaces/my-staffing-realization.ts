import type {
  StaffingParticipationEndReason,
  StaffingRealizationStatus,
  StaffingRealizationType,
} from '../types/staffing-realization';
import type {
  AdminStaffingRealizationCore,
  AdminStaffingRealizationDay,
  AdminStaffingScheduleSlot,
} from './admin-staffing-realization';
import type { SaveAdminStaffingRecruitmentPolicyPayload } from './admin-staffing-recruitment-policy';
import type { SaveAdminStaffingTravelTermsPayload } from './admin-staffing-travel-terms';

export interface StaffingReplacementCandidate {
  userId: string;
  firstName: string | null;
  nickname: string | null;
  useNickname: boolean;
}

export interface MyStaffingCandidateParticipation {
  active: boolean;
  endedAt: string | null;
  endReason: StaffingParticipationEndReason | null;
}

export interface MyStaffingCandidate {
  id: string;
  origin: 'self_application' | 'admin_proposal';
  scope: {
    mode: 'whole_realization' | 'selected_days';
    dayIds: string[];
  };
  gmDecision: 'pending' | 'accepted' | 'rejected';
  adminDecision: 'pending' | 'accepted' | 'rejected';
  state: 'draft' | 'pending' | 'confirmed' | 'rejected' | 'withdrawn';
  submittedAt: string | null;
  withdrawnAt: string | null;
  gmDecidedAt: string | null;
  adminDecidedAt: string | null;
  participation: MyStaffingCandidateParticipation;
}

export interface WithdrawMyConfirmedStaffingParticipationResult {
  candidate: MyStaffingCandidate;
  replacementProposal: MyStaffingCandidate | null;
}

export interface MyStaffingRealizationHubItem {
  id: string;
  name: string;
  type: StaffingRealizationType;
  status: StaffingRealizationStatus;
  city: string | null;
  startDate: string | null;
  endDate: string | null;
  candidate: MyStaffingCandidate | null;
}

export interface MyStaffingRealizationHub {
  available: MyStaffingRealizationHubItem[];
  proposals: MyStaffingRealizationHubItem[];
  myApplications: MyStaffingRealizationHubItem[];
  confirmed: MyStaffingRealizationHubItem[];
}

export type MyStaffingScheduleSlot = Pick<
  AdminStaffingScheduleSlot,
  'id' | 'label' | 'startTime' | 'endTime' | 'position'
>;

export interface MyStaffingRealizationDay extends Pick<
  AdminStaffingRealizationDay,
  'id' | 'date' | 'requiredGmCount'
> {
  slots: MyStaffingScheduleSlot[];
}

export type MyStaffingRecruitmentPolicy = SaveAdminStaffingRecruitmentPolicyPayload;
export type MyStaffingTravelTerms = SaveAdminStaffingTravelTermsPayload;

export interface MyStaffingRealizationDetail extends Pick<
  AdminStaffingRealizationCore,
  | 'id'
  | 'name'
  | 'description'
  | 'city'
  | 'venueName'
  | 'venueAddress'
  | 'timezone'
  | 'type'
  | 'status'
> {
  days: MyStaffingRealizationDay[];
  recruitmentPolicy: MyStaffingRecruitmentPolicy | null;
  travelTerms: MyStaffingTravelTerms | null;
  candidate: MyStaffingCandidate | null;
}
