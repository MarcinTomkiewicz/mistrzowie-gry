type ParticipantAvailabilityFields = {
  occurrenceId: string;
  availabilityStatus: 'available' | 'full' | 'not_open' | 'scheduled' | 'closed' | 'past' | 'unavailable' | 'release_disabled';
  canSignup: boolean;
  capacity: number | null;
  isUnlimited: boolean;
  remainingSeats: number | null;
  venueAttendance: {
    capacity: number | null;
    remaining: number | null;
    activeIdentities: number;
    atCapacityForNewIdentity: boolean;
  };
};

export type IEventParticipantAvailability = ParticipantAvailabilityFields & (
  | { scope: 'program_item'; programItemId: string }
  | { scope: 'whole_event'; programItemId: null }
);

export type EventParticipantSignupTarget =
  | { scope: 'program_item'; programItemId: string }
  | { scope: 'whole_event'; occurrenceId: string };

export interface IEventParticipantGuestIdentity {
  guestName: string;
  guestPhone: string;
}

export type IEventParticipantRegisterRequest = EventParticipantSignupTarget & (
  | { mode: 'authenticated' }
  | ({ mode: 'guest' } & IEventParticipantGuestIdentity)
);

export interface IEventParticipantOwnRequest {
  registrationId: string | null;
  /** A non-null code selects guest access, even for an authenticated user. */
  confirmationCode: string | null;
}

export interface IEventParticipantRegistration {
  registrationId: string;
  occurrenceId: string;
  eventProgramItemId: string | null;
}

export type IEventParticipantRegisterResult =
  | (IEventParticipantRegistration & (
      | { scope: 'program_item'; eventProgramItemId: string }
      | { scope: 'whole_event'; eventProgramItemId: null }
    ) & {
      registered: true;
      status: 'confirmed';
      /** Returned only for a guest; never persist, log or put it in a URL/SSR. */
      confirmationCode: string | null;
    })
  | {
      registered: false;
      status: 'unavailable';
    };

export type IEventParticipantGetMyResult =
  | (IEventParticipantRegistration & {
      found: true;
      status: 'confirmed' | 'cancelled';
      sessionStartAt: string | null;
      canCancel: boolean;
    })
  | {
      found: false;
      status: 'unavailable';
    };

export type IEventParticipantCancelMyResult =
  | (IEventParticipantRegistration & {
      cancelled: true;
      alreadyCancelled: boolean;
      status: 'cancelled';
    })
  | {
      cancelled: false;
      status: 'unavailable';
    };
