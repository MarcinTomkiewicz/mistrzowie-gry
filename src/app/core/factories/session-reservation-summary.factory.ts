import { ICustomerSessionEntitlement } from '../interfaces/i-customer-session-entitlement';
import { ISessionBookingProduct } from '../interfaces/i-session-booking-product';
import { ISessionReservationFinalSummaryPreview } from '../interfaces/i-session-reservation-finalization';
import { ISessionReservationFlowState } from '../interfaces/i-session-reservation-flow';
import { buildPricingPreview } from '../utils/session-pricing';
import { resolveEntitlementId } from '../utils/session-reservation-entitlement';
import {
  isReadyForSummary,
  requiresEntitlement,
} from '../utils/session-reservation-rules';

export function buildSummaryPreview(
  state: ISessionReservationFlowState,
  products: readonly ISessionBookingProduct[],
  customerEntitlements: readonly ICustomerSessionEntitlement[],
): ISessionReservationFinalSummaryPreview | null {
  if (!isReadyForSummary(state)) {
    return null;
  }

  const baseProduct = products.find(
    (product) => product.slug === state.selectedBaseProductSlug,
  );

  if (!baseProduct) {
    return null;
  }

  const pricing = buildPricingPreview(state, baseProduct, products);

  if (!pricing) {
    return null;
  }

  if (pricing.requiresManualQuote && !state.customServicesRequest?.trim()) {
    return null;
  }

  const customerEntitlementId = resolveEntitlementId(
    state.selectedCustomerEntitlementId,
    customerEntitlements,
    state.bookingMode,
  );
  const customerEntitlement = customerEntitlementId
    ? (customerEntitlements.find(
        (entitlement) => entitlement.id === customerEntitlementId,
      ) ?? null)
    : null;

  if (requiresEntitlement(state) && !customerEntitlement) {
    return null;
  }

  return {
    baseProduct,
    addonProducts: pricing.addonProducts,
    addonsSnapshot: pricing.addonsSnapshot,
    customerEntitlement,
    additionalDurationHours: pricing.additionalDurationHours,
    requiresManualQuote: pricing.requiresManualQuote,
    pricingSnapshot: pricing.pricingSnapshot,
    grossTotalPln: pricing.grossTotalPln,
  };
}
