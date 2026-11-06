import {
  EventOccurrenceStatus,
  ParticipantSignupKind,
} from '../enums/event';
import { EventScheduleKind } from '../types/event';
import { IEventSchedule } from './i-event-schedule';

export interface IEventCoreListItem {
  id: string;
  key: string;
  name: string;
  shortDescription: string | null;
  coverImagePath: string | null;
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
  coverImagePath: string | null;
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
  id?: string | null;
  key: string;
  name: string;
  shortDescription?: string | null;
  longDescription?: string | null;
  coverImagePath?: string | null;
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
  isStaffingConverted: boolean;
  isStaffingReleased: boolean;
  currentlyPublic: boolean;
  displayOrder: number;
  isForBeginners: boolean;
  timezone: string;
  startTime: string;
  endTime: string;
  participantSignupKind: ParticipantSignupKind;
  signupRequired: boolean;
  defaultSlotCapacity: number;
  defaultParticipantCapacity: number | null;
  schedule: IEventSchedule;
  occurrences: IAdminOccurrenceListItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminEventProgramParticipant {
  registrationId: string;
  displayName: string;
  contactPhone: string | null;
  participantKind: 'guest' | 'account';
  registeredAt: string;
}

export interface AdminEventProgramParticipants {
  programItemId: string;
  occurrenceId: string;
  activeCount: number;
  registrations: AdminEventProgramParticipant[];
}

export interface IAdminOccurrenceListItem {
  id: string;
  date: string;
  status: EventOccurrenceStatus;
  slotCapacity: number;
  participantCapacity: number | null;
  participantSignupKind: ParticipantSignupKind;
  capacityPolicy: 'legacy_shared' | 'independent';
  sessionCapacityCeiling: number | null;
  wholeEventCapacity: number | null;
  participantSignupOpenedAt: string | null;
  hostSignupOpensAt: string | null;
  hostSignupClosesAt: string | null;
  participantSignupOpensAt: string | null;
  participantSignupClosesAt: string | null;
  publishedAt: string | null;
  programItemCount: number;
  activeParticipantCount: number;
}

export type EventOfflineSeatsDelta = -1 | 1;

export interface AdminEventProgramOfflineSeatsItem {
  eventId: string;
  occurrenceId: string;
  occurrenceDate: string;
  programItemId: string;
  effectiveCapacity: number;
  activeOnlineBookings: number;
  offlineOccupiedSeats: number;
  remainingOnlineSeats: number;
}

export interface AdminEventProgramOfflineSeats {
  eventId: string;
  items: AdminEventProgramOfflineSeatsItem[];
}

export type AdminEventProgramOfflineSeatsAdjustment = Omit<AdminEventProgramOfflineSeatsItem, 'occurrenceDate'> & {
  delta: EventOfflineSeatsDelta;
  changed: true;
};
