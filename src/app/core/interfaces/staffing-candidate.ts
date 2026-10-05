import type {
  MyStaffingCandidate,
  MyStaffingCandidateParticipation,
} from './my-staffing-realization';

export interface AdminStaffingCandidateParticipation extends MyStaffingCandidateParticipation {
  endedBy: string | null;
}

export interface StaffingCandidate extends Omit<MyStaffingCandidate, 'participation'> {
  realizationId: string;
  gmUserId: string;
  participation: AdminStaffingCandidateParticipation;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}
