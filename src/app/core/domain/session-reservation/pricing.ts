import { SESSION_RESERVATION_CONFIG } from '../../configs/session-reservation.config';
import {
  ISessionAddonBookingProduct,
  ISessionBookingProduct,
} from '../../interfaces/i-session-booking-product';
import {
  ISessionReservationAddonSnapshot,
  ISessionReservationPricingLineItem,
  ISessionReservationPricingSnapshot,
} from '../../interfaces/i-session-reservation';
import { ISessionReservationPricingPreview } from '../../interfaces/i-session-reservation-finalization';
import { ISessionReservationFlowState } from '../../interfaces/i-session-reservation-flow';
import {
  SESSION_ADDON_EXTRA_HOUR_PRODUCT_SLUG,
  SessionBookingProductSlug,
} from '../../types/session-booking-product';
import { SESSION_PRICE_STATUSES } from '../../types/session-price-status';
import {
  calculateProductGrossTotal,
  isSessionAddonBookingProduct,
} from './booking-products';
import { requiresManualQuote as stateRequiresManualQuote } from './rules';

export function buildPricingPreview(
  state: ISessionReservationFlowState,
  baseProduct: ISessionBookingProduct,
  products: readonly ISessionBookingProduct[],
): ISessionReservationPricingPreview | null {
  const addonProductBySlug = new Map(
    products
      .filter(isSessionAddonBookingProduct)
      .map((product) => [product.slug, product] as const),
  );
  const additionalDurationHours = getAdditionalDurationHours(state, baseProduct);
  const addonProducts = resolveAddonProducts(
    state,
    addonProductBySlug,
    additionalDurationHours,
  );

  if (!addonProducts) return null;

  const requiresManualQuote =
    stateRequiresManualQuote(state) ||
    baseProduct.requiresManualQuote ||
    addonProducts.some((product) => product.requiresManualQuote) ||
    (additionalDurationHours > 0 &&
      !addonProductBySlug.get(SESSION_ADDON_EXTRA_HOUR_PRODUCT_SLUG));
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
  productBySlug: ReadonlyMap<
    ISessionAddonBookingProduct['slug'],
    ISessionAddonBookingProduct
  >,
  additionalDurationHours: number,
): ISessionAddonBookingProduct[] | null {
  const addonSlugs = new Set(state.selectedAddonSlugs);

  if (additionalDurationHours > 0) {
    addonSlugs.add(SESSION_ADDON_EXTRA_HOUR_PRODUCT_SLUG);
  }

  const addonProducts: ISessionAddonBookingProduct[] = [];

  for (const slug of addonSlugs) {
    const addonProduct = productBySlug.get(slug);

    if (!addonProduct && slug !== SESSION_ADDON_EXTRA_HOUR_PRODUCT_SLUG) {
      return null;
    }

    if (addonProduct) addonProducts.push(addonProduct);
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
  addonProducts: readonly ISessionAddonBookingProduct[],
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
  addonProducts: readonly ISessionAddonBookingProduct[],
  additionalDurationHours: number,
  lineItems: readonly ISessionReservationPricingLineItem[],
): ISessionReservationAddonSnapshot[] {
  return addonProducts.map((product) => {
    const lineItem = lineItems.find((item) => item.productId === product.id);
    const details = state.addonDetails[product.slug];

    return {
      productId: product.id,
      slug: product.slug,
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
  product: ISessionAddonBookingProduct,
  additionalDurationHours: number,
): number | null {
  if (
    product.slug === SESSION_ADDON_EXTRA_HOUR_PRODUCT_SLUG &&
    additionalDurationHours > 0
  ) {
    return additionalDurationHours;
  }

  return (
    state.addonDetails[product.slug]?.quantity ?? null
  );
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
