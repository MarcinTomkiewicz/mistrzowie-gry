import { IEvent } from '../interfaces/i-event';
import { IEventOccurrence } from '../interfaces/i-event-occurence';
import { IEventProgramItemWithDetails } from '../interfaces/i-event-program-item';

export interface IEventPublicProgramLoadData {
  event: IEvent;
  occurrences: IEventOccurrence[];
  programsByOccurrenceId: Map<string, IEventProgramItemWithDetails[]>;
}

export type EventProgramPageVm = IEventPublicProgramLoadData;
