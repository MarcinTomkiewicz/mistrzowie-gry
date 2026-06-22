export type SessionReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show';

export const SESSION_RESERVATION_STATUSES = {
  Pending: 'pending',
  Confirmed: 'confirmed',
  Cancelled: 'cancelled',
  Completed: 'completed',
  NoShow: 'no_show',
} as const satisfies Record<string, SessionReservationStatus>;

export const SESSION_RESERVATION_BLOCKING_STATUSES = [
  SESSION_RESERVATION_STATUSES.Pending,
  SESSION_RESERVATION_STATUSES.Confirmed,
] as const satisfies readonly SessionReservationStatus[];
