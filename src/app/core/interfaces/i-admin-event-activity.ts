import type { ManualRpgSlotPayload } from './i-event-program-item';

export interface AdminEventActivityKind {
  key: string;
  label: string;
  isActive: boolean;
}

export interface AdminEventActivityKinds { kinds: AdminEventActivityKind[] }

export type ManualActivityPayload = Pick<ManualRpgSlotPayload,
  'occurrenceId' | 'position' | 'startTime' | 'endTime' | 'startDayOffset' | 'endDayOffset'> & {
  kindKey: string;
  title: string;
  description: string;
  presenter?: string | null;
  attendeeCapacity?: number | null;
};

export interface ManualActivityResult {
  saved: true;
  slotId: string;
  occurrenceId: string;
  kindKey: string;
  status: 'approved';
  title: string;
  description: string;
  presenter: string | null;
  attendeeCapacity: number | null;
  blockPosition: number | null;
  participantSignupSupported: false;
}
