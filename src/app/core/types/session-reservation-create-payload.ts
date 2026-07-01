import type { ISessionReservationCreateBase } from '../interfaces/i-session-reservation';
import type { SessionBookingMode } from './session-booking-mode';
import type { SessionReservationSourceKind } from './session-reservation-source-kind';

export type SessionReservationSourceSelection =
  | {
      sourceKind: Extract<SessionReservationSourceKind, 'gm_session_template'>;
      gmSessionTemplateId: string;
      customSessionId: null;
    }
  | {
      sourceKind: Extract<SessionReservationSourceKind, 'custom_session'>;
      gmSessionTemplateId: null;
      customSessionId: string;
    }
  | {
      sourceKind: Extract<SessionReservationSourceKind, 'system_only'>;
      gmSessionTemplateId: null;
      customSessionId: null;
    };

export type SessionReservationBookingSelection =
  | {
      bookingMode: Extract<
        SessionBookingMode,
        'single_session' | 'custom_quote'
      >;
      customerEntitlementId: null;
    }
  | {
      bookingMode: Extract<
        SessionBookingMode,
        'package_credit' | 'subscription_credit'
      >;
      customerEntitlementId: string;
    };

export type SessionReservationCreatePayload =
  ISessionReservationCreateBase &
    SessionReservationSourceSelection &
    SessionReservationBookingSelection;
