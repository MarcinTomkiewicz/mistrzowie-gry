import { SessionReservationFallbackModeEnum, SessionReservationStepEnum } from '../enums/session-reservation-flow';
import { ICustomerSessionEntitlement } from './i-customer-session-entitlement';
import { IGmPublicProfile } from './i-gm-public-profile';
import { ISessionBookingProduct } from './i-session-booking-product';
import { ISessionReservationContact } from './i-session-reservation-contact';
import { ISystem } from './i-system';
import { SessionBookingMode } from '../types/session-booking-mode';
import {
  SessionAddonProductSlug,
  SessionReservationBaseProductSlug,
} from '../types/session-booking-product';
import { SessionReservationFlowMode } from '../types/session-reservation-flow-mode';

export type SessionReservationStep = `${SessionReservationStepEnum}`;
export type SessionReservationFallbackMode =
  `${SessionReservationFallbackModeEnum}`;

export interface ISessionReservationGmExtraInfo {
  message: string | null;
  createCharactersAtTable: boolean;
  provideCharacterGuidelines: boolean;
  characterGuidelines: string | null;
  extraNotes: string | null;
}

export interface ISessionReservationAddonDetails {
  customerDetails: string | null;
  quantity: number | null;
}

export type SessionReservationAddonDetailsMap = Partial<
  Record<SessionAddonProductSlug, ISessionReservationAddonDetails>
>;

export interface ISessionReservationFlowState {
  flowMode: SessionReservationFlowMode;
  bookingMode: SessionBookingMode;
  step: SessionReservationStep;
  selectedBaseProductSlug: SessionReservationBaseProductSlug;
  selectedAddonSlugs: readonly SessionAddonProductSlug[];
  selectedCustomerEntitlementId: string | null;
  selectedGmId: string | null;
  selectedSystemId: string | null;
  selectedDate: string | null;
  selectedStartTime: string | null;
  selectedDurationHours: number;
  contact: ISessionReservationContact;
  playersCount: number | null;
  gmExtraInfo: ISessionReservationGmExtraInfo;
  addonDetails: SessionReservationAddonDetailsMap;
  customServicesRequest: string | null;
  fallbackMode: SessionReservationFallbackMode;
}

export interface ISessionReservationInitialOptions {
  products: readonly ISessionBookingProduct[];
  systems: readonly ISystem[];
  gms: readonly IGmPublicProfile[];
}

export interface ISessionReservationSummaryPreview {
  baseProduct: ISessionBookingProduct;
  addonProducts: readonly ISessionBookingProduct[];
  customerEntitlement: ICustomerSessionEntitlement | null;
  requiresManualQuote: boolean;
  grossTotalPln: number | null;
}
