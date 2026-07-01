import { inject, Injectable } from '@angular/core';

import { ICustomerSessionEntitlement } from '../../interfaces/i-customer-session-entitlement';
import { ISessionBookingProduct } from '../../interfaces/i-session-booking-product';
import { ISessionReservationFlowState } from '../../interfaces/i-session-reservation-flow';
import { ISessionReservationFinalSummaryPreview } from '../../interfaces/i-session-reservation-finalization';
import { SessionReservationEntitlementService } from '../session-reservation-entitlement/session-reservation-entitlement';
import { SessionReservationPricingService } from '../session-reservation-pricing/session-reservation-pricing';
import { SessionReservationRulesService } from '../session-reservation-rules/session-reservation-rules';

@Injectable({ providedIn: 'root' })
export class SessionReservationSummaryService {
  private readonly entitlement = inject(SessionReservationEntitlementService);
  private readonly pricing = inject(SessionReservationPricingService);
  private readonly rules = inject(SessionReservationRulesService);

  buildSummaryPreview(
    state: ISessionReservationFlowState,
    products: readonly ISessionBookingProduct[],
    customerEntitlements: readonly ICustomerSessionEntitlement[],
  ): ISessionReservationFinalSummaryPreview | null {
    if (!this.rules.isReadyForSummary(state)) {
      return null;
    }

    const baseProduct =
      products.find((product) => product.slug === state.selectedBaseProductSlug) ??
      null;

    if (!baseProduct) {
      return null;
    }

    const pricing = this.pricing.buildPricingPreview(
      state,
      baseProduct,
      products,
    );

    if (!pricing) {
      return null;
    }

    if (pricing.requiresManualQuote && !state.customServicesRequest?.trim()) {
      return null;
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
}
