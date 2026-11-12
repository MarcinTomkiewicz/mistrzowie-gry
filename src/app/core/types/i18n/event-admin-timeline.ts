import type { TimelineRow } from '../../interfaces/i-admin-event-timeline';
import type { MyStaffingCandidate } from '../../interfaces/my-staffing-realization';

export type EventAdminTimelineCopy = {
  globalProgram: { empty: string; saveFirst: string; pendingCalendar: string; otherOperation: string; unavailable: string };
  schedule: {
    title: string; track: string; hint: string; assignmentStatus: string; history: string; eventScoped: string;
  };
  manualProgram: {
    unavailable: string; block: string; position: string; discardConfirmQuestion: string; discardConfirm: string; saved: string; failed: string;
    uncertain: string; conflict: string; contractFailed: string; intervalInvalid: string; positionTaken: string;
    abandon: string; abandonConfirmQuestion: string; abandonConfirm: string; refreshRequired: string;
  };
  manualRpg: {
    action: string; hint: string; gm: string; source: string; session: string; template: string; custom: string;
    slotLabel: string; capacity: string; capacityHint: string; saveConfirmQuestion: string; saveConfirm: string; catalogFailed: string; noSessions: string;
  };
  manualActivity: {
    action: string; hint: string; kind: string; title: string; description: string; presenter: string;
    capacity: string; capacityHint: string; catalogFailed: string; emptyKinds: string; refreshKinds: string; saveConfirmQuestion: string; saveConfirm: string;
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
  participationEnded: string;
  participantsEmpty: string;
  participantRemoveConfirm: string;
  participantRemoveFailed: string;
  participantsRefreshFailed: string;
  sources: Record<TimelineRow['source'], string>;
  candidateStates: Record<Exclude<MyStaffingCandidate['state'], 'pending'>, string>;
};
