import {
  ISessionAddonBookingProduct,
  ISessionBookingProduct,
} from '../../interfaces/i-session-booking-product';
import {
  SESSION_ADDON_PRODUCT_SLUGS,
} from '../../types/session-booking-product';

export function isSessionAddonBookingProduct(
  product: ISessionBookingProduct,
): product is ISessionAddonBookingProduct {
  return SESSION_ADDON_PRODUCT_SLUGS.some((slug) => slug === product.slug);
}

export function calculateProductGrossTotal(
  product: ISessionBookingProduct,
  quantity: number,
  baseGrossPricePln: number | null,
): number | null {
  if (product.requiresManualQuote) return null;

  if (product.pricePercent !== null) {
    return baseGrossPricePln === null
      ? null
      : (baseGrossPricePln * product.pricePercent * quantity) / 100;
  }

  return product.grossPricePln === null
    ? null
    : product.grossPricePln * quantity;
}
