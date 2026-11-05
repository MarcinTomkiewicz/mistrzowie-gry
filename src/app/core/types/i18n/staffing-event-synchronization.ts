export type StaffingEventSynchronizationCopy = {
  title: string;
  inProgress: string;
  updated: string;
  current: string;
  failed: string;
  uncertain: string;
  readbackFailed: string;
  retry: string;
  retryRead: string;
  abandon: string;
  abandonConfirm: string;
  abandoned: string;
  dirty: string;
  occurrences: string;
  slots: string;
  programItems: string;
  openEvent: string;
  errors: Record<'forbidden' | 'notConverted' | 'privateRequired' | 'history' | 'provenance' | 'schedule' |
    'capacity' | 'slots' | 'sourceIdentity' | 'sourceChanged' | 'assignment' | 'pastRemoval' | 'occurrences' | 'identity' | 'invalid' | 'unknown', string>;
};
