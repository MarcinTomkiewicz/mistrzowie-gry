import { SESSION_RESERVATION_CONFIG } from '../configs/session-reservation.config';
import { ISessionBookingProduct } from '../interfaces/i-session-booking-product';
import {
  ISessionReservationAddonSnapshot,
  ISessionReservationPricingLineItem,
  ISessionReservationPricingSnapshot,
} from '../interfaces/i-session-reservation';
import { ISessionReservationPricingPreview } from '../interfaces/i-session-reservation-finalization';
import { ISessionReservationFlowState } from '../interfaces/i-session-reservation-flow';
import { SessionReservationAddonDetailsMap } from '../types/session-reservation-addon-details';
import {
  SESSION_ADDON_EXTRA_HOUR_PRODUCT_SLUG,
  SESSION_CUSTOM_ADDITIONAL_SERVICE_PRODUCT_SLUG,
  SessionAddonProductSlug,
  SessionBookingProductSlug,
} from '../types/session-booking-product';
import {
  SESSION_BOOKING_MODES,
  SessionBookingMode,
} from '../types/session-booking-mode';
import { SESSION_PRICE_STATUSES } from '../types/session-price-status';
import { formatMoney } from './pricing';
import { requiresManualQuote as stateRequiresManualQuote } from './session-reservation-rules';

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
    if (total === null) {
      return null;
    }

    const details = addonDetails[product.slug as SessionAddonProductSlug];
    const quantity = product.pricePercent === null ? details?.quantity ?? 1 : 1;
    const addonTotal = calculateProductGrossTotal(
      product,
      quantity,
      baseProduct.grossPricePln,
    );

    return addonTotal === null ? null : total + addonTotal;
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

export function buildPricingPreview(
  state: ISessionReservationFlowState,
  baseProduct: ISessionBookingProduct,
  products: readonly ISessionBookingProduct[],
): ISessionReservationPricingPreview | null {
  const productBySlug = new Map(
    products.map((product) => [product.slug, product] as const),
  );
  const additionalDurationHours = getAdditionalDurationHours(
    state,
    baseProduct,
  );
  const addonProducts = resolveAddonProducts(
    state,
    productBySlug,
    additionalDurationHours,
  );

  if (!addonProducts) {
    return null;
  }

  const requiresManualQuote =
    stateRequiresManualQuote(state) ||
    baseProduct.requiresManualQuote ||
    addonProducts.some((product) => product.requiresManualQuote) ||
    (additionalDurationHours > 0 &&
      !productBySlug.get(SESSION_ADDON_EXTRA_HOUR_PRODUCT_SLUG));
  const pricingSnapshot = buildPricingSnapshot(
    state,
    baseProduct,
    addonProducts,
    additionalDurationHours,
    requiresManualQuote,
  );

  return {
    addonProducts,
    addonsSnapshot: buildAddonsSnapshot(
      state,
      addonProducts,
      additionalDurationHours,
      pricingSnapshot.lineItems,
    ),
    additionalDurationHours,
    requiresManualQuote,
    pricingSnapshot,
    grossTotalPln: pricingSnapshot.grossTotalPln,
  };
}

function resolveAddonProducts(
  state: ISessionReservationFlowState,
  productBySlug: ReadonlyMap<SessionBookingProductSlug, ISessionBookingProduct>,
  additionalDurationHours: number,
): ISessionBookingProduct[] | null {
  const addonSlugs = new Set<SessionAddonProductSlug>(state.selectedAddonSlugs);

  if (additionalDurationHours > 0) {
    addonSlugs.add(SESSION_ADDON_EXTRA_HOUR_PRODUCT_SLUG);
  }

  const addonProducts: ISessionBookingProduct[] = [];

  for (const slug of addonSlugs) {
    const addonProduct = productBySlug.get(slug);

    if (!addonProduct && slug !== SESSION_ADDON_EXTRA_HOUR_PRODUCT_SLUG) {
      return null;
    }

    if (addonProduct) {
      addonProducts.push(addonProduct);
    }
  }

  return addonProducts;
}

function getAdditionalDurationHours(
  state: ISessionReservationFlowState,
  baseProduct: ISessionBookingProduct,
): number {
  const baseDurationHours =
    baseProduct.standardDurationHours ??
    SESSION_RESERVATION_CONFIG.defaultDurationHours;

  return Math.max(state.selectedDurationHours - baseDurationHours, 0);
}

function buildPricingSnapshot(
  state: ISessionReservationFlowState,
  baseProduct: ISessionBookingProduct,
  addonProducts: readonly ISessionBookingProduct[],
  additionalDurationHours: number,
  requiresManualQuote: boolean,
): ISessionReservationPricingSnapshot {
  const baseLineItem = buildPricingLineItem(
    baseProduct,
    baseProduct.slug,
    baseProduct.name,
    1,
    baseProduct.grossPricePln,
  );
  const addonLineItems = addonProducts.map((product) =>
    buildPricingLineItem(
      product,
      product.slug,
      product.name,
      resolveAddonQuantity(state, product, additionalDurationHours),
      baseProduct.grossPricePln,
    ),
  );
  const lineItems = [baseLineItem, ...addonLineItems];
  const hasManualLineItem = lineItems.some(
    (item) => item.priceStatus === SESSION_PRICE_STATUSES.ManualQuoteRequired,
  );
  const priceStatus =
    requiresManualQuote || hasManualLineItem
      ? SESSION_PRICE_STATUSES.ManualQuoteRequired
      : SESSION_PRICE_STATUSES.Fixed;
  const addonsGrossTotalPln =
    priceStatus === SESSION_PRICE_STATUSES.ManualQuoteRequired
      ? null
      : addonLineItems.reduce(
          (sum, item) => sum + (item.grossTotalPln ?? 0),
          0,
        );
  const grossTotalPln =
    priceStatus === SESSION_PRICE_STATUSES.ManualQuoteRequired
      ? null
      : lineItems.reduce((sum, item) => sum + (item.grossTotalPln ?? 0), 0);

  return {
    currency: SESSION_RESERVATION_CONFIG.currency,
    baseProductId: baseProduct.id,
    baseProductSlug: state.selectedBaseProductSlug,
    baseGrossPricePln: baseLineItem.grossTotalPln,
    addonsGrossTotalPln,
    grossTotalPln,
    priceStatus,
    manualQuoteReason:
      priceStatus === SESSION_PRICE_STATUSES.ManualQuoteRequired
        ? state.customServicesRequest
        : null,
    lineItems,
  };
}

function buildPricingLineItem(
  product: ISessionBookingProduct,
  slug: SessionBookingProductSlug,
  label: string,
  quantity: number | null,
  baseGrossPricePln: number | null,
): ISessionReservationPricingLineItem {
  const normalizedQuantity = quantity ?? 1;
  const grossUnitPricePln =
    product.pricePercent === null ? product.grossPricePln : null;
  const grossTotalPln = calculateProductGrossTotal(
    product,
    normalizedQuantity,
    baseGrossPricePln,
  );

  return {
    productId: product.id,
    slug,
    label,
    quantity,
    grossUnitPricePln,
    pricePercent: product.pricePercent,
    grossTotalPln,
    priceStatus:
      product.requiresManualQuote || grossTotalPln === null
        ? SESSION_PRICE_STATUSES.ManualQuoteRequired
        : SESSION_PRICE_STATUSES.Fixed,
  };
}

function buildAddonsSnapshot(
  state: ISessionReservationFlowState,
  addonProducts: readonly ISessionBookingProduct[],
  additionalDurationHours: number,
  lineItems: readonly ISessionReservationPricingLineItem[],
): ISessionReservationAddonSnapshot[] {
  return addonProducts.map((product) => {
    const lineItem = lineItems.find((item) => item.productId === product.id);
    const details = state.addonDetails[product.slug as SessionAddonProductSlug];

    return {
      productId: product.id,
      slug: product.slug as SessionAddonProductSlug,
      name: product.name,
      pricingType: resolveAddonPricingType(product),
      quantity: resolveAddonQuantity(state, product, additionalDurationHours),
      unitLabel: product.unitLabel,
      appliesPer: product.metadata.appliesPer ?? null,
      grossUnitPricePln: lineItem?.grossUnitPricePln ?? null,
      pricePercent: product.pricePercent,
      grossTotalPln: lineItem?.grossTotalPln ?? null,
      requiresQuantity: product.requiresQuantity,
      requiresManualQuote: product.requiresManualQuote,
      customerDetails: details?.customerDetails ?? null,
      priceLabel: product.metadata.priceLabel ?? null,
    };
  });
}

function resolveAddonQuantity(
  state: ISessionReservationFlowState,
  product: ISessionBookingProduct,
  additionalDurationHours: number,
): number | null {
  if (
    product.slug === SESSION_ADDON_EXTRA_HOUR_PRODUCT_SLUG &&
    additionalDurationHours > 0
  ) {
    return additionalDurationHours;
  }

  return (
    state.addonDetails[product.slug as SessionAddonProductSlug]?.quantity ??
    null
  );
}

function calculateProductGrossTotal(
  product: ISessionBookingProduct,
  quantity: number,
  baseGrossPricePln: number | null,
): number | null {
  if (product.requiresManualQuote) {
    return null;
  }

  if (product.pricePercent !== null) {
    return baseGrossPricePln === null
      ? null
      : (baseGrossPricePln * product.pricePercent * quantity) / 100;
  }

  return product.grossPricePln === null
    ? null
    : product.grossPricePln * quantity;
}

function resolveAddonPricingType(
  product: ISessionBookingProduct,
): ISessionReservationAddonSnapshot['pricingType'] {
  if (
    product.pricingType === 'hour' ||
    product.pricingType === 'addon' ||
    product.pricingType === 'custom'
  ) {
    return product.pricingType;
  }

  return 'addon';
}
