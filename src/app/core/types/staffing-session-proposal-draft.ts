import type { StaffingCandidateSessionProposalSlot } from '../interfaces/staffing-candidate-session-proposals';
import type { StaffingSessionReference } from '../interfaces/staffing-session-reference';

export interface StaffingSessionMappingDraft {
  key: string;
  position: number;
  selection: StaffingSessionReference | null;
}

export type StaffingSessionProposalSlotDraft = Omit<StaffingCandidateSessionProposalSlot, 'mappings'> & {
  mappings: StaffingSessionMappingDraft[];
};
