import { OfferItemKind, OfferPricingType } from '../types/offers';
import {
  SessionAddonProductSlug,
  SessionBookingProductSlug,
} from '../types/session-booking-product';

export type SessionBookingProductAppliesPer =
  | 'reservation'
  | 'player'
  | 'campaign'
  | 'startedHour'
  | 'basePrice'
  | 'session';

export interface ISessionBookingProductMetadata {
  priceLabel?: string;
  vatIncluded?: boolean;
  standardIncluded?: string;
  billingPeriod?: 'month';
  appliesPer?: SessionBookingProductAppliesPer;
  minGrossPricePln?: number;
  mayRequireManualAdjustment?: boolean;
  includesSessionZero?: boolean;
  includesCharacterCreation?: boolean;
  source?: 'custom_services_request';
  requiresCustomerDetails?: boolean;
  customerDetailsLabel?: string;
  customerDetailsPlaceholder?: string;
  quantityLabel?: string;
  priceDescription?: string;
}

export interface ISessionBookingProduct {
  id: string;
  slug: SessionBookingProductSlug;
  name: string;
  description: string | null;
  kind: OfferItemKind;
  pricingType: OfferPricingType;
  grossPricePln: number | null;
  pricePercent: number | null;
  currency: 'PLN';
  standardDurationHours: number | null;
  includedSessionsCount: number | null;
  monthlySessionsCount: number | null;
  unitLabel: string | null;
  requiresQuantity: boolean;
  requiresManualQuote: boolean;
  isPublic: boolean;
  isActive: boolean;
  sortOrder: number;
  offerItemId: number | null;
  metadata: ISessionBookingProductMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface ISessionAddonBookingProduct
  extends ISessionBookingProduct {
  slug: SessionAddonProductSlug;
}
