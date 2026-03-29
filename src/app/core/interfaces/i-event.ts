import { ParticipantSignupKind } from "../enums/event";

export interface IEvent {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  longDescription: string | null;
  coverImagePath: string | null;
  facebookLink: string | null;

  isActive: boolean;
  isForBeginners: boolean;

  timezone: string;
  startTime: string;
  endTime: string;
  singleDate: string | null;

  participantSignupKind: ParticipantSignupKind;
  signupRequired: boolean;

  defaultSlotCapacity: number;
  defaultParticipantCapacity: number | null;

  createdAt: string;
  updatedAt: string;
}