import type { IEventParticipantAvailability } from '../../interfaces/i-event-participant';

export type EventPageTranslations = {
  placeLabel: string;
  addressLabel: string;
  freeLabel: string;
  noOccurrences: string;
};

export type EventPageProgramTranslations = {
  eventScoped: string;
  dayOffset: string;
  title: string;
  occurrenceLabel: string;
  timeToBeDetermined: string;
  pending: string;
  inPreparation: string;
};

export type EventPageOfflineSeatsTranslations = Record<
  'title' | 'online' | 'offline' | 'remaining' | 'capacity' | 'add' | 'remove' | 'verified' |
  'readbackPending' | 'uncertain' | 'endReadback' | 'endReadbackQuestion' | 'endReadbackWarning' | 'readbackEnded', string
> & {
  errors: Record<'forbidden' | 'invalid' | 'notFound' | 'notBookable' | 'capacityUnavailable' | 'empty' | 'capacityExceeded' | 'unknown', string>;
};

export type EventPageParticipantSignupTranslations = {
  wholeEventTitle: string;
  confirmedWholeEvent: string;
  wholeEventUnavailable: string;
  wholeEventPrivacyNotice: string;
  rejected: string;
  unlimitedSeats: string;
  availabilityReadFailed: string;
  availabilityStatuses: Record<IEventParticipantAvailability['availabilityStatus'], string>;
  title: string;
  guestNameLabel: string;
  phoneHint: string;
  invalidPhone: string;
  accountNotice: string;
  privacyNotice: string;
  remainingSeats: string;
  confirmed: string;
  confirmedSession: string;
  cancellationContact: string;
  unavailable: string;
  unknownResult: string;
  registrationNumber: string;
  confirmationCodeLabel: string;
  confirmationCodeInstructions: string;
  nextSteps: string;
  copyCodeFailed: string;
  ownReadError: string;
  cancelled: string;
  leaveConfirmation: string;
  discardReceiptConfirmation: string;
};
