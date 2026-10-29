import type { EventTimelineOrigin } from '../../interfaces/i-admin-event-timeline';
import type { MyStaffingCandidate } from '../../interfaces/my-staffing-realization';

export type EventAdminTimelineCopy = {
  title: string;
  entry: string;
  host: string;
  rpgSession: string;
  programStatus: string;
  dayOffset: string;
  localHint: string;
  selectOccurrence: string;
  invalidSelection: string;
  source: string;
  frozen: string;
  noOccurrences: string;
  noRows: string;
  unassigned: string;
  noHost: string;
  loadFailed: string;
  eventHours: string;
  participationEnded: string;
  participantsEmpty: string;
  participantRemoveConfirm: string;
  participantRemoveFailed: string;
  participantsRefreshFailed: string;
  sources: Record<EventTimelineOrigin, string>;
  candidateStates: Record<Exclude<MyStaffingCandidate['state'], 'pending'>, string>;
};
