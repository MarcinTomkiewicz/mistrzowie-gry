import type {
  EventOccurrenceStatus, EventProgramItemStatus, ParticipantSignupKind,
} from '../enums/event';
import type { SessionSourceKind } from '../types/session-source';
import type { MyStaffingCandidate } from './my-staffing-realization';

export type EventTimelineOrigin = 'staffing' | 'manual';
export type TimelineStatus = 'confirmed' | 'pending';

export interface TimelineHost {
  userId: string;
  displayName: string;
}

export interface EventScopedTimelineSession {
  title: string | null;
  systemId: string | null;
  systemName: string | null;
  maxPlayers: unknown; // Raw JSONB, preserved without numeric coercion.
  effectiveCapacity: number | null;
}

export interface TimelineSession extends EventScopedTimelineSession {
  gmDeclaredMaxPlayers: unknown;
  playerCapacityOverride: number | null;
}

export interface TimelineRowBase {
  source: EventTimelineOrigin | 'event_scoped';
  timeScope: 'event' | 'timed';
  slotId: string | null;
  programItemId: string | null;
  sourceFinalPlanItemId: string | null;
  sourceSessionId: string | null;
  sourceKind: SessionSourceKind | null;
  startTime: string | null;
  endTime: string | null;
  slotLabel: string | null;
  position: number | null;
  displayOrder: number | null;
  status: TimelineStatus;
  programStatus: EventProgramItemStatus | null;
  host: TimelineHost | null;
  session: EventScopedTimelineSession | null;
  editable: boolean;
  activeBookings: number;
  updatedAt: string;
  frozen: boolean | null;
  participantSignupSupported: boolean | null;
}

export interface StaffingTimelineRow extends TimelineRowBase {
  source: 'staffing';
  timeScope: 'timed';
  startTime: string;
  endTime: string;
  session: TimelineSession | null;
  slotId: string;
  sourceFinalPlanItemId: string | null;
  candidateState: MyStaffingCandidate['state'] | null;
  participationEnded: boolean;
  frozen: boolean;
  participantSignupSupported: boolean | null;
  editable: false;
  activity?: never;
  startDayOffset?: never;
  endDayOffset?: never;
}

export interface TimelineActivity {
  kindKey: string;
  kindLabel: string | null;
  title: string;
  description: string;
  presenter: string | null;
  attendeeCapacity: number | null;
  status: EventProgramItemStatus.Approved | EventProgramItemStatus.Published;
  participantSignupSupported: false;
}

interface ManualTimelineRowBase extends TimelineRowBase {
  source: 'manual';
  timeScope: 'timed';
  startTime: string;
  endTime: string;
  session: TimelineSession | null;
  slotId: string;
  sourceFinalPlanItemId: null;
  candidateState?: never;
  participationEnded?: never;
  frozen: boolean | null;
  participantSignupSupported: false;
  startDayOffset: number;
  endDayOffset: number;
  spaceId: string | null;
  blockId: string | null;
  blockLabel: string | null;
  blockPosition: number | null;
  spaceName: string | null;
}

export type ManualTimelineRow = ManualTimelineRowBase & (
  | { activity: TimelineActivity; programItemId: null; host: null; session: null;
      sourceKind: null; sourceSessionId: null; programStatus: TimelineActivity['status'] }
  | { activity: null; programItemId: string; programStatus: EventProgramItemStatus }
  | { activity: null; programItemId: null; host: null; session: null;
      sourceKind: null; sourceSessionId: null; programStatus: null; status: 'pending' }
);

export interface EventScopedTimelineRow extends TimelineRowBase {
  source: 'event_scoped';
  timeScope: 'event';
  startTime: null;
  endTime: null;
  slotId: null;
  sourceFinalPlanItemId: null;
  sourceKind: SessionSourceKind;
  programItemId: string;
  programStatus: EventProgramItemStatus;
  slotLabel: null;
  host: TimelineHost;
  session: EventScopedTimelineSession;
  candidateState?: never;
  participationEnded?: never;
  frozen: boolean;
  editable: false;
  participantSignupSupported: false;
  activity?: never;
  startDayOffset?: never;
  endDayOffset?: never;
}

export type TimelineRow = StaffingTimelineRow | ManualTimelineRow | EventScopedTimelineRow;

export interface AdminEventTimelineOccurrence {
  occurrenceId: string;
  date: string;
  status: EventOccurrenceStatus;
  slotCapacity: number;
  capacityPolicy: 'legacy_shared' | 'independent';
  sessionCapacityCeiling: number | null;
  wholeEventCapacity: number | null;
  venueAttendanceCapacity: number | null;
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
  spaces: { spaceId: string; name: string; isActive: boolean }[];
  revision: string;
  occurrences: AdminEventTimelineOccurrence[];
}
