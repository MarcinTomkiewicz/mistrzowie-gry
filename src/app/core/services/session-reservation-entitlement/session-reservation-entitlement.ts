import { Injectable } from '@angular/core';

import { ICustomerSessionEntitlement } from '../../interfaces/i-customer-session-entitlement';
import { CUSTOMER_SESSION_ENTITLEMENT_KINDS } from '../../types/customer-session-entitlement';
import {
  SESSION_BOOKING_MODES,
  SessionBookingMode,
} from '../../types/session-booking-mode';

@Injectable({ providedIn: 'root' })
export class SessionReservationEntitlementService {
  isEntitlementValidForBookingMode(
    entitlement: ICustomerSessionEntitlement,
    bookingMode: SessionBookingMode,
  ): boolean {
    if (bookingMode === SESSION_BOOKING_MODES.PackageCredit) {
      return entitlement.kind === CUSTOMER_SESSION_ENTITLEMENT_KINDS.Package;
    }

    if (bookingMode === SESSION_BOOKING_MODES.SubscriptionCredit) {
      return (
        entitlement.kind === CUSTOMER_SESSION_ENTITLEMENT_KINDS.Subscription
      );
    }

    return false;
  }

  resolveSelectedEntitlementId(
    selectedId: string | null,
    entitlements: readonly ICustomerSessionEntitlement[],
    bookingMode: SessionBookingMode,
  ): string | null {
    if (!selectedId) {
      return null;
    }

    const entitlement =
      entitlements.find((item) => item.id === selectedId) ?? null;

    if (!entitlement) {
      return null;
    }

    return this.isEntitlementValidForBookingMode(entitlement, bookingMode)
      ? selectedId
      : null;
  }
}
