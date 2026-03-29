import { IEvent } from './i-event';
import { IEventOccurrence } from './i-event-occurence';
import { IEventProgramItemWithDetails } from './i-event-program-item';

export interface IChaoticThursdaysOccurrence extends IEventOccurrence {
  eventSlug: IEvent['slug'];
  eventName: IEvent['name'];
  eventStartTime: IEvent['startTime'];
  eventEndTime: IEvent['endTime'];
  isArchived: boolean;
  freeSlots: number;
  publishedItemsCount: number;
}

export interface IChaoticThursdaysProgram {
  occurrence: IChaoticThursdaysOccurrence;
  items: IEventProgramItemWithDetails[];
}

export interface IChaoticThursdaysOccurrenceOption {
  id: IEventOccurrence['id'];
  occurrenceDate: IEventOccurrence['occurrenceDate'];
  isFull: boolean;
}

export interface IChaoticThursdaysPageData {
  event: Pick<
    IEvent,
    | 'id'
    | 'slug'
    | 'name'
    | 'shortDescription'
    | 'longDescription'
    | 'coverImagePath'
    | 'facebookLink'
    | 'timezone'
    | 'startTime'
    | 'endTime'
    | 'participantSignupKind'
    | 'signupRequired'
  >;
  occurrenceOptions: IChaoticThursdaysOccurrenceOption[];
  selectedProgram: IChaoticThursdaysProgram | null;
}