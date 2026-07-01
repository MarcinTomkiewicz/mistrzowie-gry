import { inject, Injectable } from '@angular/core';

import { ICustomerSessionEntitlement } from '../../interfaces/i-customer-session-entitlement';
import { ISessionBookingProduct } from '../../interfaces/i-session-booking-product';
import {
  ISessionReservationFlowState,
  ISessionReservationSummaryPreview,
} from '../../interfaces/i-session-reservation-flow';
import { calculateProductsGrossTotal } from '../../utils/session-pricing';
import { SessionReservationEntitlementService } from '../session-reservation-entitlement/session-reservation-entitlement';
import { SessionReservationRulesService } from '../session-reservation-rules/session-reservation-rules';

@Injectable({ providedIn: 'root' })
export class SessionReservationSummaryService {
  private readonly entitlement = inject(SessionReservationEntitlementService);
  private readonly rules = inject(SessionReservationRulesService);

  buildSummaryPreview(
    state: ISessionReservationFlowState,
    products: readonly ISessionBookingProduct[],
    customerEntitlements: readonly ICustomerSessionEntitlement[],
  ): ISessionReservationSummaryPreview | null {
    if (!this.rules.isReadyForSummary(state)) return null;

    const productBySlug = new Map(
      products.map((product) => [product.slug, product] as const),
    );
    const baseProduct = productBySlug.get(state.selectedBaseProductSlug);
    if (!baseProduct) return null;

    const addonProducts: ISessionBookingProduct[] = [];

    for (const slug of state.selectedAddonSlugs) {
      const addonProduct = productBySlug.get(slug);

      if (!addonProduct) return null;

      addonProducts.push(addonProduct);
    }

    const customerEntitlementId = this.entitlement.resolveSelectedEntitlementId(
      state.selectedCustomerEntitlementId,
      customerEntitlements,
      state.bookingMode,
    );
    const customerEntitlement = customerEntitlementId
      ? (customerEntitlements.find(
          (entitlement) => entitlement.id === customerEntitlementId,
        ) ?? null)
      : null;

    if (this.rules.requiresCustomerEntitlement(state) && !customerEntitlement) {
      return null;
    }

    const requiresManualQuote =
      this.rules.requiresManualQuote(state) ||
      baseProduct.requiresManualQuote ||
      addonProducts.some((product) => product.requiresManualQuote);

    if (requiresManualQuote && !state.customServicesRequest?.trim()) {
      return null;
    }

    return {
      baseProduct,
      addonProducts,
      customerEntitlement,
      requiresManualQuote,
      grossTotalPln: requiresManualQuote
        ? null
        : calculateProductsGrossTotal(
            baseProduct,
            addonProducts,
            state.addonDetails,
          ),
    };
  }
}
