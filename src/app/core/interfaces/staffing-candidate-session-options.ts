import type { SessionSourceKind } from '../types/session-source';
import type { ISessionWithRelations } from './i-session';
import type { StaffingCandidateSessionProposals } from './staffing-candidate-session-proposals';

export interface StaffingCandidateSessionOptions {
  sessions: Record<SessionSourceKind, ISessionWithRelations[]>;
  proposals: StaffingCandidateSessionProposals;
}
