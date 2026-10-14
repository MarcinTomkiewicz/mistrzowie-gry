import type { IEventOccurrence } from '../interfaces/i-event-occurence';
import type {
  IPublicEventEdition,
  IPublicEventPage,
} from '../interfaces/i-event-page';

export type PublicEventOccurrence = Pick<IEventOccurrence, 'id' | 'occurrenceDate'>;

export type PublicEventPageState =
  | { kind: 'loading' | 'not-found' | 'error' }
  | { kind: 'redirect'; path: string }
  | {
      kind: 'ready';
      page: IPublicEventPage;
      edition: IPublicEventEdition;
      occurrences: readonly PublicEventOccurrence[];
    };
