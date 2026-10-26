import type {
  EventOccurrenceStatus, EventProgramItemStatus, ParticipantSignupKind,
} from '../enums/event';
import type { SessionSourceKind } from '../types/session-source';
import type { MyStaffingCandidate } from './my-staffing-realization';

export type EventTimelineOrigin = 'staffing' | 'manual' | 'legacy_host';
export type TimelineStatus = 'confirmed' | 'pending';

export interface TimelineHost {
  userId: string;
  displayName: string;
}

export interface LegacyTimelineSession {
  title: string | null;
  systemId: string | null;
  systemName: string | null;
  maxPlayers: unknown; // Legacy raw JSONB projection.
  effectiveCapacity: number | null;
}

export interface TimelineSession extends LegacyTimelineSession {
  maxPlayers: number | null;
  gmDeclaredMaxPlayers: number | null;
  playerCapacityOverride: number | null;
}

export interface TimelineRowBase {
  source: EventTimelineOrigin;
  programItemId: string | null;
  sourceSessionId: string | null;
  sourceKind: SessionSourceKind | null;
  startTime: string;
  endTime: string;
  slotLabel: string | null;
  position: number | null;
  displayOrder: number | null;
  status: TimelineStatus;
  programStatus: EventProgramItemStatus | null;
  host: TimelineHost | null;
  session: LegacyTimelineSession | null;
  editable: boolean;
  activeBookings: number;
  updatedAt: string;
}

export interface StaffingTimelineRow extends TimelineRowBase {
  source: 'staffing';
  session: TimelineSession | null;
  slotId: string;
  sourceFinalPlanItemId: string | null;
  candidateState: MyStaffingCandidate['state'] | null;
  participationEnded: boolean;
  frozen: boolean;
  participantSignupSupported: boolean | null;
}

export interface ManualTimelineRow extends TimelineRowBase {
  source: 'manual';
  session: TimelineSession | null;
  slotId: string;
  sourceFinalPlanItemId: null;
  candidateState?: never;
  participationEnded?: never;
  frozen: boolean | null;
  participantSignupSupported: false;
}

// Legacy hours describe the Edition, rather than an individual session.
export interface LegacyHostTimelineRow extends TimelineRowBase {
  source: 'legacy_host';
  slotId: null;
  sourceFinalPlanItemId: null;
  sourceKind: SessionSourceKind;
  programItemId: string;
  programStatus: EventProgramItemStatus;
  slotLabel: null;
  host: TimelineHost;
  session: LegacyTimelineSession;
  candidateState?: never;
  participationEnded?: never;
  frozen: false;
  editable: false;
  participantSignupSupported: false;
}

export type TimelineRow = StaffingTimelineRow | ManualTimelineRow | LegacyHostTimelineRow;

export interface AdminEventTimelineOccurrence {
  occurrenceId: string;
  date: string;
  status: EventOccurrenceStatus;
  slotCapacity: number;
  capacityPolicy: 'legacy_shared' | 'independent';
  sessionCapacityCeiling: number | null;
  wholeEventCapacity: number | null;
  legacySharedParticipantCapacity: number | null;
  participantSignupKind: ParticipantSignupKind;
  participantSignupOpenedAt: string | null;
  updatedAt: string;
  rows: TimelineRow[];
}

export interface AdminEventTimeline {
  eventId: string; // Local Edition UUID.
  eventCoreId: string;
  timezone: string;
  eventStartTime: string;
  eventEndTime: string;
  origin: EventTimelineOrigin;
  revision: string;
  occurrences: AdminEventTimelineOccurrence[];
}
