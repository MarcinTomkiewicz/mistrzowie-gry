export interface IEventParticipantAvailability {
  programItemId: string;
  occurrenceId: string;
  canSignup: boolean;
  remainingSeats: number | null;
}

export interface IEventParticipantGuestIdentity {
  guestName: string;
  guestPhone: string;
}

export type IEventParticipantRegisterRequest = {
  programItemId: string;
} & (
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
  eventProgramItemId: string;
}

export type IEventParticipantRegisterResult =
  | (IEventParticipantRegistration & {
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
