import type { StaffingSessionSelectionMode } from '../types/staffing-realization';
import type { StaffingSessionReference } from './staffing-session-reference';

export interface CandidateSlotSessionMappingInput extends StaffingSessionReference {
  slotId: string;
  position: number;
}

export interface StaffingCandidateSessionMapping extends StaffingSessionReference {
  id: string;
  position: number;
}

export interface StaffingCandidateSessionProposalSlot {
  slotId: string;
  dayId: string;
  date: string;
  label: string;
  startTime: string;
  endTime: string;
  position: number;
  mappings: StaffingCandidateSessionMapping[];
}

export interface StaffingCandidateSessionProposals {
  candidateId: string;
  sessionSelectionMode: StaffingSessionSelectionMode;
  requiredSessionMappingsPerSlot: number | null;
  editable: boolean;
  complete: boolean;
  slots: StaffingCandidateSessionProposalSlot[];
}
