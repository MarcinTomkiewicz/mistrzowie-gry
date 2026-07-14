import { ParticipantSignupKind } from '../enums/event';

export interface IPublicEventPage {
  core: IPublicEventCore;
  defaultEventId: string | null;
  editions: IPublicEventEdition[];
}

export interface IPublicEventCore {
  id: string;
  key: string;
  name: string;
  shortDescription: string | null;
  longDescription: string | null;
}

export interface IPublicEventEdition {
  id: string;
  slug: string;
  city: string;
  venueName: string | null;
  venueAddress: string | null;
  priceAmount: number | null;
  priceCurrency: string;
  priceLabel: string | null;
  coverImagePath: string | null;
  facebookLink: string | null;
  isForBeginners: boolean;
  timezone: string;
  startTime: string;
  endTime: string;
  participantSignupKind: ParticipantSignupKind;
  signupRequired: boolean;
  defaultSlotCapacity: number;
  defaultParticipantCapacity: number | null;
  displayOrder: number;
}
