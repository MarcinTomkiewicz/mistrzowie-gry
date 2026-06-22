export type SessionReservationSourceKind =
  | 'gm_session_template'
  | 'custom_session'
  | 'system_only';

export const SESSION_RESERVATION_SOURCE_KINDS = {
  GmSessionTemplate: 'gm_session_template',
  CustomSession: 'custom_session',
  SystemOnly: 'system_only',
} as const satisfies Record<string, SessionReservationSourceKind>;

