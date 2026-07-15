import { SESSION_RESERVATION_CONFIG } from '../configs/session-reservation.config';
import { ISessionReservationFlowState } from '../interfaces/i-session-reservation-flow';
import { SESSION_BOOKING_MODES } from '../types/session-booking-mode';

export function requiresEntitlement(
  state: ISessionReservationFlowState,
): boolean {
  return (
    state.bookingMode === SESSION_BOOKING_MODES.PackageCredit ||
    state.bookingMode === SESSION_BOOKING_MODES.SubscriptionCredit
  );
}

export function requiresManualQuote(
  state: ISessionReservationFlowState,
): boolean {
  const manualQuoteSlugs =
    SESSION_RESERVATION_CONFIG.manualQuoteProductSlugs as readonly string[];

  return (
    state.bookingMode === SESSION_BOOKING_MODES.CustomQuote ||
    manualQuoteSlugs.includes(state.selectedBaseProductSlug) ||
    state.selectedAddonSlugs.some((slug) => manualQuoteSlugs.includes(slug))
  );
}

export function areAddonsComplete(
  state: ISessionReservationFlowState,
): boolean {
  const detailsRequired =
    SESSION_RESERVATION_CONFIG.addonProductSlugsRequiringCustomerDetails as readonly string[];
  const quantityRequired =
    SESSION_RESERVATION_CONFIG.addonProductSlugsRequiringQuantity as readonly string[];

  return state.selectedAddonSlugs.every((slug) => {
    const details = state.addonDetails[slug];
    const hasRequiredDetails =
      !detailsRequired.includes(slug) || !!details?.customerDetails?.trim();
    const hasRequiredQuantity =
      !quantityRequired.includes(slug) ||
      (typeof details?.quantity === 'number' && details.quantity > 0);

    return hasRequiredDetails && hasRequiredQuantity;
  });
}

export function isReadyForSummary(
  state: ISessionReservationFlowState,
): boolean {
  const extraInfo = state.gmExtraInfo;

  return (
    !!state.selectedGmId &&
    !!state.selectedSystemId &&
    !!state.selectedDate &&
    !!state.selectedStartTime &&
    state.contact.customerName.trim().length > 0 &&
    state.contact.customerEmail.trim().length > 0 &&
    (!extraInfo.provideCharacterGuidelines ||
      !!extraInfo.characterGuidelines?.trim()) &&
    (!requiresManualQuote(state) || !!state.customServicesRequest?.trim()) &&
    (!requiresEntitlement(state) || !!state.selectedCustomerEntitlementId) &&
    areAddonsComplete(state)
  );
}
