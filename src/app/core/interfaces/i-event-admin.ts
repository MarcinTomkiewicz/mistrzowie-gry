import {
  EventOccurrenceStatus,
  ParticipantSignupKind,
} from '../enums/event';
import { EventScheduleKind } from '../types/event';
import {
  IEventRecurringSchedule,
  IEventSingleSchedule,
} from './i-event-schedule';

export interface IEventCoreListItem {
  id: string;
  key: string;
  name: string;
  shortDescription: string | null;
  isActive: boolean;
  hasPublicPage: boolean;
  displayOrder: number;
  editionCount: number;
  activeEditionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IEventCoreDetail {
  id: string;
  key: string;
  name: string;
  shortDescription: string | null;
  longDescription: string | null;
  isActive: boolean;
  hasPublicPage: boolean;
  displayOrder: number;
  editions: IEventEditionSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface IEventEditionSummary {
  id: string;
  slug: string;
  city: string;
  isActive: boolean;
  isDefaultPublic: boolean;
  displayOrder: number;
  occurrenceCount: number;
  programItemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IEventCoreSavePayload {
  id: string | null;
  key: string;
  name: string;
  shortDescription: string | null;
  longDescription: string | null;
  isActive: boolean;
  hasPublicPage: boolean;
  displayOrder: number;
}

export interface IAdminEventListItem {
  id: string;
  eventCoreId: string;
  eventCoreKey: string;
  eventCoreName: string;
  slug: string;
  city: string;
  venueName: string | null;
  venueAddress: string | null;
  isActive: boolean;
  isDefaultPublic: boolean;
  displayOrder: number;
  isForBeginners: boolean;
  timezone: string;
  startTime: string;
  endTime: string;
  scheduleKind: EventScheduleKind;
  nextOccurrenceDate: string | null;
  occurrenceCount: number;
  programItemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IAdminEventDetail {
  id: string;
  eventCoreId: string;
  eventCoreKey: string;
  eventCoreName: string;
  eventCoreShortDescription: string | null;
  eventCoreLongDescription: string | null;
  slug: string;
  city: string;
  venueName: string | null;
  venueAddress: string | null;
  priceAmount: number | null;
  priceCurrency: string;
  priceLabel: string | null;
  coverImagePath: string | null;
  facebookLink: string | null;
  isActive: boolean;
  isDefaultPublic: boolean;
  displayOrder: number;
  isForBeginners: boolean;
  timezone: string;
  startTime: string;
  endTime: string;
  participantSignupKind: ParticipantSignupKind;
  signupRequired: boolean;
  defaultSlotCapacity: number;
  defaultParticipantCapacity: number | null;
  schedule: IEventSingleSchedule | IEventRecurringSchedule;
  occurrences: IAdminOccurrenceListItem[];
  createdAt: string;
  updatedAt: string;
}

export interface IEventSavePayload {
  id: string | null;
  eventCoreId: string;
  slug: string;
  city: string;
  venueName: string | null;
  venueAddress: string | null;
  priceAmount: number | null;
  priceCurrency: string;
  priceLabel: string | null;
  coverImagePath: string | null;
  facebookLink: string | null;
  isActive: boolean;
  isDefaultPublic: boolean;
  displayOrder: number;
  isForBeginners: boolean;
  timezone: string;
  startTime: string;
  endTime: string;
  participantSignupKind: ParticipantSignupKind;
  signupRequired: boolean;
  defaultSlotCapacity: number;
  defaultParticipantCapacity: number | null;
  schedule: IEventSingleSchedule | IEventRecurringSchedule;
}

export interface IAdminOccurrenceListItem {
  id: string;
  date: string;
  status: EventOccurrenceStatus;
  slotCapacity: number;
  participantCapacity: number | null;
  participantSignupKind: ParticipantSignupKind;
  hostSignupOpensAt: string | null;
  hostSignupClosesAt: string | null;
  participantSignupOpensAt: string | null;
  participantSignupClosesAt: string | null;
  publishedAt: string | null;
  programItemCount: number;
  activeParticipantCount: number;
}

export interface IOccurrenceSavePayload {
  id: string;
  status: EventOccurrenceStatus;
  slotCapacity: number;
  participantCapacity: number | null;
  participantSignupKind: ParticipantSignupKind;
  hostSignupOpensAt: string | null;
  hostSignupClosesAt: string | null;
  participantSignupOpensAt: string | null;
  participantSignupClosesAt: string | null;
}

export interface IAdminOccurrence extends IAdminOccurrenceListItem {
  eventId: string;
  updatedAt: string;
}
