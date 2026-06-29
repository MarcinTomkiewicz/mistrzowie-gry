import { ISessionBookingProduct } from '../interfaces/i-session-booking-product';
import { SessionReservationAddonDetailsMap } from '../interfaces/i-session-reservation-flow';
import { SessionAddonProductSlug } from '../types/session-booking-product';

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
