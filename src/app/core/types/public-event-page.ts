import type { IEventOccurrence } from '../interfaces/i-event-occurence';
import type { PublicEventProgramEntry } from './public-event-program';
import type { ISystem } from '../interfaces/i-system';
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
      program: readonly PublicEventProgramEntry[];
      systems: readonly ISystem[];
    };
