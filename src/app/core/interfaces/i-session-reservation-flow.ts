import type { ICustomerSessionEntitlement } from './i-customer-session-entitlement';
import type { IGmPublicProfile } from './i-gm-public-profile';
import type { ISessionBookingProduct } from './i-session-booking-product';
import type { ISessionReservationContact } from './i-session-reservation-contact';
import type { ISystem } from './i-system';
import type { SessionBookingMode } from '../types/session-booking-mode';
import type {
  SessionAddonProductSlug,
  SessionReservationBaseProductSlug,
} from '../types/session-booking-product';
import type { SessionReservationAddonDetailsMap } from '../types/session-reservation-addon-details';
import type { SessionReservationFlowMode } from '../types/session-reservation-flow-mode';

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

export interface ISessionReservationFlowState {
  flowMode: SessionReservationFlowMode;
  bookingMode: SessionBookingMode;
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

export interface ISessionReservationAddonCustomerDetailsChange {
  slug: SessionAddonProductSlug;
  customerDetails: string | null;
}

export interface ISessionReservationAddonQuantityChange {
  slug: SessionAddonProductSlug;
  quantity: number | null;
}
