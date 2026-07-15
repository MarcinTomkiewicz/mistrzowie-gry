import { SESSION_RESERVATION_CONFIG } from '../../configs/session-reservation.config';
import { ISessionReservationFlowState } from '../../interfaces/i-session-reservation-flow';
import { SESSION_BOOKING_MODES } from '../../types/session-booking-mode';
import { SessionAddonProductSlug } from '../../types/session-booking-product';

export function requiresEntitlement(state: ISessionReservationFlowState): boolean {
  return (
    state.bookingMode === SESSION_BOOKING_MODES.PackageCredit ||
    state.bookingMode === SESSION_BOOKING_MODES.SubscriptionCredit
  );
}

export function requiresManualQuote(state: ISessionReservationFlowState): boolean {
  return (
    state.bookingMode === SESSION_BOOKING_MODES.CustomQuote ||
    SESSION_RESERVATION_CONFIG.manualQuoteProductSlugs.some(
      (slug) => slug === state.selectedBaseProductSlug,
    ) ||
    state.selectedAddonSlugs.some((selectedSlug) =>
      SESSION_RESERVATION_CONFIG.manualQuoteProductSlugs.some(
        (slug) => slug === selectedSlug,
      ),
    )
  );
}

export function isAddonCustomerDetailsRequired(
  slug: SessionAddonProductSlug,
): boolean {
  return SESSION_RESERVATION_CONFIG.addonProductSlugsRequiringCustomerDetails.some(
    (requiredSlug) => requiredSlug === slug,
  );
}

export function isAddonQuantityRequired(
  slug: SessionAddonProductSlug,
): boolean {
  return SESSION_RESERVATION_CONFIG.addonProductSlugsRequiringQuantity.some(
    (requiredSlug) => requiredSlug === slug,
  );
}

export function areAddonsComplete(state: ISessionReservationFlowState): boolean {
  return state.selectedAddonSlugs.every((slug) => {
    const details = state.addonDetails[slug];
    const hasRequiredDetails =
      !isAddonCustomerDetailsRequired(slug) ||
      !!details?.customerDetails?.trim();
    const hasRequiredQuantity =
      !isAddonQuantityRequired(slug) ||
      (typeof details?.quantity === 'number' && details.quantity > 0);

    return hasRequiredDetails && hasRequiredQuantity;
  });
}

export function isReadyForSummary(state: ISessionReservationFlowState): boolean {
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
