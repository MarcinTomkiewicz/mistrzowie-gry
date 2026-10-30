import type { EventTimelineOrigin } from '../../interfaces/i-admin-event-timeline';
import type { MyStaffingCandidate } from '../../interfaces/my-staffing-realization';

export type EventAdminTimelineCopy = {
  manualProgram: {
    unavailable: string; block: string; position: string; discardConfirm: string; saved: string; failed: string;
    uncertain: string; conflict: string; contractFailed: string; intervalInvalid: string; positionTaken: string;
    abandon: string; abandonConfirm: string; refreshRequired: string;
  };
  manualRpg: {
    action: string; hint: string; gm: string; source: string; session: string; template: string; custom: string;
    slotLabel: string; capacity: string; capacityHint: string; saveConfirm: string; catalogFailed: string; noSessions: string;
  };
  manualActivity: {
    action: string; hint: string; kind: string; title: string; description: string; presenter: string;
    capacity: string; capacityHint: string; catalogFailed: string; emptyKinds: string; refreshKinds: string; saveConfirm: string;
  };
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
