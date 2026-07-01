import { SessionBookingMode } from '../types/session-booking-mode';
import {
  SessionAddonProductSlug,
  SessionBookingProductSlug,
  SessionReservationBaseProductSlug,
} from '../types/session-booking-product';
import { OfferPricingType } from '../types/offers';
import { SessionPriceStatus } from '../types/session-price-status';
import { SessionReservationSourceKind } from '../types/session-reservation-source-kind';
import { SessionReservationStatus } from '../types/session-reservation-status';
import { ISessionReservationContact } from './i-session-reservation-contact';
import { SessionBookingProductAppliesPer } from './i-session-booking-product';

export interface ISessionReservationAddonSnapshot {
  productId: string;
  slug: SessionAddonProductSlug;
  name: string;
  pricingType: Extract<OfferPricingType, 'hour' | 'addon' | 'custom'>;
  quantity: number | null;
  unitLabel: string | null;
  appliesPer: SessionBookingProductAppliesPer | null;
  grossUnitPricePln: number | null;
  pricePercent: number | null;
  grossTotalPln: number | null;
  requiresQuantity: boolean;
  requiresManualQuote: boolean;
  customerDetails: string | null;
  priceLabel: string | null;
}

export interface ISessionReservationPricingLineItem {
  productId: string;
  slug: SessionBookingProductSlug;
  label: string;
  quantity: number | null;
  grossUnitPricePln: number | null;
  pricePercent: number | null;
  grossTotalPln: number | null;
  priceStatus: SessionPriceStatus;
}

export interface ISessionReservationPricingSnapshot {
  currency: 'PLN';
  baseProductId: string;
  baseProductSlug: SessionReservationBaseProductSlug;
  baseGrossPricePln: number | null;
  addonsGrossTotalPln: number | null;
  grossTotalPln: number | null;
  priceStatus: SessionPriceStatus;
  manualQuoteReason: string | null;
  lineItems: ISessionReservationPricingLineItem[];
}

export interface ISessionReservation extends ISessionReservationContact {
  id: string;
  userId: string | null;
  bookingMode: SessionBookingMode;
  status: SessionReservationStatus;
  gmProfileId: string;
  systemId: string;
  sourceKind: SessionReservationSourceKind;
  gmSessionTemplateId: string | null;
  customSessionId: string | null;
  startsAt: string;
  endsAt: string;
  durationHours: number;
  baseProductId: string;
  customerEntitlementId: string | null;
  playersCount: number | null;
  message: string | null;
  createCharactersAtTable: boolean;
  provideCharacterGuidelines: boolean;
  characterGuidelines: string | null;
  extraNotes: string | null;
  addonsSnapshotJson: ISessionReservationAddonSnapshot[];
  customServicesRequest: string | null;
  pricingSnapshotJson: ISessionReservationPricingSnapshot;
  grossTotalPln: number | null;
  currency: 'PLN';
  priceStatus: SessionPriceStatus;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
}

export interface ISessionReservationCreateBase
  extends ISessionReservationContact {
  userId: string | null;
  gmProfileId: string;
  systemId: string;
  status: SessionReservationStatus;
  startsAt: string;
  endsAt: string;
  durationHours: number;
  baseProductId: string;
  playersCount: number | null;
  message: string | null;
  createCharactersAtTable: boolean;
  provideCharacterGuidelines: boolean;
  characterGuidelines: string | null;
  extraNotes: string | null;
  addonsSnapshotJson: ISessionReservationAddonSnapshot[];
  customServicesRequest: string | null;
  pricingSnapshotJson: ISessionReservationPricingSnapshot;
  grossTotalPln: number | null;
  currency: 'PLN';
  priceStatus: SessionPriceStatus;
}
