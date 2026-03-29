import { EventOccurrenceStatus, ParticipantSignupKind } from "../enums/event";


export interface IEventOccurrence {
  id: string;
  eventId: string;
  occurrenceDate: string;

  status: EventOccurrenceStatus;

  slotCapacity: number;
  participantCapacity: number | null;

  participantSignupKind: ParticipantSignupKind;

  hostSignupOpensAt: string | null;
  hostSignupClosesAt: string | null;
  participantSignupOpensAt: string | null;
  participantSignupClosesAt: string | null;
  publishedAt: string | null;

  createdAt: string;
  updatedAt: string;
}