export const SESSION_RESERVATION_WIZARD_STEPS = {
  Offer: 1,
  Gm: 2,
  System: 3,
  Slot: 4,
  Details: 5,
} as const;

export type SessionReservationWizardStep =
  (typeof SESSION_RESERVATION_WIZARD_STEPS)[keyof typeof SESSION_RESERVATION_WIZARD_STEPS];
