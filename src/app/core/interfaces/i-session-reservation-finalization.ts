import type { ICustomerSessionEntitlement } from './i-customer-session-entitlement';
import type {
  ISessionAddonBookingProduct,
  ISessionBookingProduct,
} from './i-session-booking-product';
import type {
  ISessionReservationAddonSnapshot,
  ISessionReservationPricingSnapshot,
} from './i-session-reservation';
import type {
  ISessionReservationFlowState,
  ISessionReservationSummaryPreview,
} from './i-session-reservation-flow';

export interface ISessionReservationPricingPreview {
  addonProducts: readonly ISessionAddonBookingProduct[];
  addonsSnapshot: readonly ISessionReservationAddonSnapshot[];
  additionalDurationHours: number;
  requiresManualQuote: boolean;
  pricingSnapshot: ISessionReservationPricingSnapshot;
  grossTotalPln: number | null;
}

export interface ISessionReservationFinalSummaryPreview
  extends ISessionReservationSummaryPreview,
    ISessionReservationPricingPreview {}

export interface ISessionReservationSubmitRequest {
  state: ISessionReservationFlowState;
  products: readonly ISessionBookingProduct[];
  customerEntitlements: readonly ICustomerSessionEntitlement[];
  userId: string | null;
}

export interface ISessionReservationSubmitToastTranslations {
  invalidFormSummary: string;
  invalidFormDetail: string;
  saveSuccessSummary: string;
  saveSuccessDetail: string;
  saveFailedSummary: string;
  saveFailedDetail: string;
  slotUnavailableSummary: string;
  slotUnavailableDetail: string;
}
