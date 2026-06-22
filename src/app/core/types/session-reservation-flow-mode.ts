export type SessionReservationFlowMode = 'gm_first' | 'system_first';

export const SESSION_RESERVATION_FLOW_MODES = {
  GmFirst: 'gm_first',
  SystemFirst: 'system_first',
} as const satisfies Record<string, SessionReservationFlowMode>;

