import type { ISessionReservationAddonDetails } from '../interfaces/i-session-reservation-flow';
import type { SessionAddonProductSlug } from './session-booking-product';

export type SessionReservationAddonDetailsMap = Partial<
  Record<SessionAddonProductSlug, ISessionReservationAddonDetails>
>;
