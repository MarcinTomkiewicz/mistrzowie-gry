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

export type EventSignupAccessState =
  | 'allowed'
  | 'closed'
  | 'forbidden'
  | 'full';

export type EventSignupPageLoadError =
  | {
      kind: 'catalog';
      cause: unknown;
    }
  | {
      kind: 'edition-data';
      cause: unknown;
    };
