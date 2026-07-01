import { SESSION_RESERVATION_CONFIG } from '../configs/session-reservation.config';
import { ISessionBookingProduct } from '../interfaces/i-session-booking-product';
import { SessionReservationAddonDetailsMap } from '../types/session-reservation-addon-details';
import {
  SESSION_CUSTOM_ADDITIONAL_SERVICE_PRODUCT_SLUG,
  SessionAddonProductSlug,
} from '../types/session-booking-product';
import {
  SESSION_BOOKING_MODES,
  SessionBookingMode,
} from '../types/session-booking-mode';
import { formatMoney } from './pricing';

export function formatSessionBookingProductPriceLabel(
  product: ISessionBookingProduct,
  labels: { manualQuoteRequired: string },
): string {
  if (product.requiresManualQuote) {
    return labels.manualQuoteRequired;
  }

  if (product.pricePercent !== null) {
    return `+${product.pricePercent}%`;
  }

  return (
    formatMoney(product.grossPricePln, SESSION_RESERVATION_CONFIG.currency) ??
    labels.manualQuoteRequired
  );
}

export function calculateProductsGrossTotal(
  baseProduct: ISessionBookingProduct,
  addonProducts: readonly ISessionBookingProduct[],
  addonDetails: SessionReservationAddonDetailsMap,
): number | null {
  if (baseProduct.requiresManualQuote || baseProduct.grossPricePln === null) {
    return null;
  }

  const baseTotal = baseProduct.grossPricePln;

  return addonProducts.reduce<number | null>((total, product) => {
    if (total === null || product.requiresManualQuote) {
      return null;
    }

    if (product.pricePercent !== null) {
      return total + (baseTotal * product.pricePercent) / 100;
    }

    if (product.grossPricePln === null) {
      return null;
    }

    const details = addonDetails[product.slug as SessionAddonProductSlug];

    return total + product.grossPricePln * (details?.quantity ?? 1);
  }, baseTotal);
}

export function resolveSessionBookingMode(
  product: ISessionBookingProduct,
): SessionBookingMode {
  if (product.slug === SESSION_CUSTOM_ADDITIONAL_SERVICE_PRODUCT_SLUG) {
    return SESSION_BOOKING_MODES.CustomQuote;
  }

  if (product.monthlySessionsCount !== null) {
    return SESSION_BOOKING_MODES.SubscriptionCredit;
  }

  if (product.includedSessionsCount !== null) {
    return SESSION_BOOKING_MODES.PackageCredit;
  }

  return SESSION_BOOKING_MODES.SingleSession;
}
