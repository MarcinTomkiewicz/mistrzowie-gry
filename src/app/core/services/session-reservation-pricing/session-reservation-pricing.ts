import { inject, Injectable } from '@angular/core';

import { SESSION_RESERVATION_CONFIG } from '../../configs/session-reservation.config';
import { ISessionBookingProduct } from '../../interfaces/i-session-booking-product';
import {
  ISessionReservationAddonSnapshot,
  ISessionReservationPricingLineItem,
  ISessionReservationPricingSnapshot,
} from '../../interfaces/i-session-reservation';
import { ISessionReservationFlowState } from '../../interfaces/i-session-reservation-flow';
import { ISessionReservationPricingPreview } from '../../interfaces/i-session-reservation-finalization';
import {
  SESSION_ADDON_EXTRA_HOUR_PRODUCT_SLUG,
  SessionAddonProductSlug,
  SessionBookingProductSlug,
} from '../../types/session-booking-product';
import { SESSION_PRICE_STATUSES } from '../../types/session-price-status';
import { SessionReservationRulesService } from '../session-reservation-rules/session-reservation-rules';

@Injectable({ providedIn: 'root' })
export class SessionReservationPricingService {
  private readonly rules = inject(SessionReservationRulesService);

  buildPricingPreview(
    state: ISessionReservationFlowState,
    baseProduct: ISessionBookingProduct,
    products: readonly ISessionBookingProduct[],
  ): ISessionReservationPricingPreview | null {
    const productBySlug = new Map(
      products.map((product) => [product.slug, product] as const),
    );
    const additionalDurationHours = this.getAdditionalDurationHours(
      state,
      baseProduct,
    );
    const addonProducts = this.resolveAddonProducts(
      state,
      productBySlug,
      additionalDurationHours,
    );

    if (!addonProducts) {
      return null;
    }

    const requiresManualQuote =
      this.rules.requiresManualQuote(state) ||
      baseProduct.requiresManualQuote ||
      addonProducts.some((product) => product.requiresManualQuote) ||
      (additionalDurationHours > 0 &&
        !productBySlug.get(SESSION_ADDON_EXTRA_HOUR_PRODUCT_SLUG));

    const pricingSnapshot = this.buildPricingSnapshot(
      state,
      baseProduct,
      addonProducts,
      additionalDurationHours,
      requiresManualQuote,
    );

    return {
      addonProducts,
      addonsSnapshot: this.buildAddonsSnapshot(
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

  private resolveAddonProducts(
    state: ISessionReservationFlowState,
    productBySlug: ReadonlyMap<SessionBookingProductSlug, ISessionBookingProduct>,
    additionalDurationHours: number,
  ): ISessionBookingProduct[] | null {
    const addonSlugs = new Set<SessionAddonProductSlug>(
      state.selectedAddonSlugs,
    );

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

  private getAdditionalDurationHours(
    state: ISessionReservationFlowState,
    baseProduct: ISessionBookingProduct,
  ): number {
    const baseDurationHours =
      baseProduct.standardDurationHours ??
      SESSION_RESERVATION_CONFIG.defaultDurationHours;

    return Math.max(state.selectedDurationHours - baseDurationHours, 0);
  }

  private buildPricingSnapshot(
    state: ISessionReservationFlowState,
    baseProduct: ISessionBookingProduct,
    addonProducts: readonly ISessionBookingProduct[],
    additionalDurationHours: number,
    requiresManualQuote: boolean,
  ): ISessionReservationPricingSnapshot {
    const baseLineItem = this.buildPricingLineItem(
      baseProduct,
      baseProduct.slug,
      baseProduct.name,
      1,
      baseProduct.grossPricePln,
    );
    const addonLineItems = addonProducts.map((product) =>
      this.buildPricingLineItem(
        product,
        product.slug,
        product.name,
        this.resolveAddonQuantity(state, product, additionalDurationHours),
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

  private buildPricingLineItem(
    product: ISessionBookingProduct,
    slug: SessionBookingProductSlug,
    label: string,
    quantity: number | null,
    baseGrossPricePln: number | null,
  ): ISessionReservationPricingLineItem {
    const normalizedQuantity = quantity ?? 1;
    const grossUnitPricePln =
      product.pricePercent === null ? product.grossPricePln : null;
    const grossTotalPln = this.calculateLineGrossTotal(
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

  private buildAddonsSnapshot(
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
        pricingType: this.resolveAddonPricingType(product),
        quantity: this.resolveAddonQuantity(
          state,
          product,
          additionalDurationHours,
        ),
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

  private resolveAddonQuantity(
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

  private calculateLineGrossTotal(
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

  private resolveAddonPricingType(
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
}
