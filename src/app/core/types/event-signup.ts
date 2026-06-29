import {
  EventOccurrenceStatus,
  EventProgramItemStatus,
} from '../enums/event';

export const ACTIVE_HOST_SIGNUP_STATUSES: readonly EventProgramItemStatus[] = [
  EventProgramItemStatus.Submitted,
  EventProgramItemStatus.Approved,
  EventProgramItemStatus.Published,
] as const;

export const HOST_SIGNUP_OCCURRENCE_STATUSES: readonly EventOccurrenceStatus[] = [
  EventOccurrenceStatus.HostSignupOpen,
  EventOccurrenceStatus.Published,
] as const;

export type EventSignupFormToastConfig = {
  successSummary: string;
  successDetail: string;
  errorSummary: string;
  errorDetail: string;
};
