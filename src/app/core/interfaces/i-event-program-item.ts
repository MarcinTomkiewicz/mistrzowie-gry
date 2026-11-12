import {
  EventProgramItemSourceKind,
  EventProgramItemStatus,
} from '../enums/event';
import type { SessionSourceKind } from '../types/session-source';
import type { TimelineStatus } from './i-admin-event-timeline';

export interface ManualRpgSlotPayload {
  occurrenceId: string;
  label: string;
  position: number;
  startTime: string;
  endTime: string;
  startDayOffset: number;
  endDayOffset: number;
  gmUserId: string;
  sessionKind: SessionSourceKind;
  sessionId: string;
  playerCapacityOverride?: number | null;
}

// Only the three fields confirmed by the frozen EFS-075 contract are consumed.
export interface ManualRpgSlotResult {
  status: TimelineStatus;
  programItemId: string;
  effectivePlayerCapacity: number | null;
}

export interface IEventProgramItem {
  id: string;
  occurrenceId: string;
  hostUserId: string;

  sourceKind: EventProgramItemSourceKind;
  gmSessionTemplateId: string | null;
  customSessionId: string | null;

  status: EventProgramItemStatus;
  displayOrder: number | null;

  createdAt: string;
  updatedAt: string;
}

export interface ICreateEventProgramItemPayload {
  occurrenceId: string;
  hostUserId: string;
  sourceKind: EventProgramItemSourceKind;
  gmSessionTemplateId: string | null;
  customSessionId: string | null;
  status: EventProgramItemStatus;
  displayOrder: number | null;
}
