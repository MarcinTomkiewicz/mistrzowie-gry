import type { SessionSourceKind } from '../types/session-source';

export interface StaffingSessionReference {
  sourceKind: SessionSourceKind;
  sessionId: string;
}
