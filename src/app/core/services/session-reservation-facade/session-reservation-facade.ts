import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin, map, Observable, of, tap } from 'rxjs';

import { SESSION_RESERVATION_FLOW_MODES } from '../../configs/session-reservation-flow-mode.config';
import {
  ICustomerSessionEntitlement,
  ICustomerSessionEntitlementLookup,
} from '../../interfaces/i-customer-session-entitlement';
import { IGmPublicProfile } from '../../interfaces/i-gm-public-profile';
import { ISessionBookingProduct } from '../../interfaces/i-session-booking-product';
import {
  ISessionReservationAvailableSlot,
  ISessionReservationGmSlot,
} from '../../interfaces/i-session-reservation-availability';
import {
  ISessionReservationInitialOptions,
  ISessionReservationSummaryPreview,
} from '../../interfaces/i-session-reservation-flow';
import { ISystem } from '../../interfaces/i-system';
import { CUSTOMER_SESSION_ENTITLEMENT_KINDS } from '../../types/customer-session-entitlement';
import {
  SESSION_BOOKING_MODES,
  SessionBookingMode,
} from '../../types/session-booking-mode';
import {
  SESSION_CUSTOM_ADDITIONAL_SERVICE_PRODUCT_SLUG,
  SessionReservationBaseProductSlug,
} from '../../types/session-booking-product';
import { SessionReservationFlowMode } from '../../types/session-reservation-flow-mode';
import { calculateProductsGrossTotal } from '../../utils/session-pricing';
import { SessionReservationAvailabilityService } from '../session-reservation-availability/session-reservation-availability';
import { SessionReservationStore } from '../session-reservation-store/session-reservation-store';
import { SessionReservationService } from '../session-reservation/session-reservation';

@Injectable({ providedIn: 'root' })
export class SessionReservationFacade {
  private readonly reservation = inject(SessionReservationService);
  private readonly availability = inject(SessionReservationAvailabilityService);

  readonly store = inject(SessionReservationStore);

  readonly products = signal<readonly ISessionBookingProduct[]>([]);
  readonly activeSystems = signal<readonly ISystem[]>([]);
  readonly visibleGms = signal<readonly IGmPublicProfile[]>([]);
  readonly systemsForSelectedGm = signal<readonly ISystem[]>([]);
  readonly gmsForSelectedSystem = signal<readonly IGmPublicProfile[]>([]);
  readonly availableSlots = signal<readonly ISessionReservationAvailableSlot[]>([]);
  readonly customerEntitlements = signal<readonly ICustomerSessionEntitlement[]>([]);

  private readonly productBySlug = computed(
    () => new Map(this.products().map((product) => [product.slug, product] as const)),
  );

  loadInitialOptions(): Observable<ISessionReservationInitialOptions> {
    return forkJoin({
      products: this.reservation.getActiveBookingProducts(),
      systems: this.reservation.getActiveSystems(),
      gms: this.reservation.getVisibleGms(),
    }).pipe(
      tap(({ products, systems, gms }) => {
        this.products.set(products);
        this.activeSystems.set(systems);
        this.visibleGms.set(gms);
      }),
    );
  }

  loadCustomerEntitlements(
    customer: ICustomerSessionEntitlementLookup,
  ): Observable<ICustomerSessionEntitlement[]> {
    return this.reservation.getCustomerEntitlements(customer).pipe(
      tap((entitlements) => {
        this.customerEntitlements.set(entitlements);
        this.selectCustomerEntitlement(
          this.store.selectedCustomerEntitlementId(),
        );
      }),
    );
  }

  resetReservationFlow(): void {
    this.store.reset();
    this.products.set([]);
    this.activeSystems.set([]);
    this.visibleGms.set([]);
    this.systemsForSelectedGm.set([]);
    this.gmsForSelectedSystem.set([]);
    this.availableSlots.set([]);
    this.customerEntitlements.set([]);
  }

  loadAvailableSlotsForSelectedGm(
    fromIso: string,
    toIsoExclusive: string,
  ): Observable<ISessionReservationAvailableSlot[]> {
    const gmId = this.store.selectedGmId();

    if (!gmId || !this.isSelectedGmValidForCurrentSystem()) {
      this.availableSlots.set([]);
      return of([]);
    }

    const toTime = Date.parse(toIsoExclusive);

    return this.loadNextSlotsForSelectedSystem(fromIso).pipe(
      map((slots) =>
        slots.filter(
          (slot) =>
            slot.gmProfileId === gmId && Date.parse(slot.startsAt) < toTime,
        ),
      ),
      tap((slots) => this.availableSlots.set(slots)),
    );
  }

  private loadNextSlotsForSelectedSystem(
    fromIso: string,
  ): Observable<ISessionReservationGmSlot[]> {
    const systemId = this.store.selectedSystemId();

    if (!systemId) {
      return of([]);
    }

    return this.availability
      .getNextSlotsForSystem(
        systemId,
        fromIso,
        this.store.selectedDurationHours(),
      );
  }

  selectFlowMode(flowMode: SessionReservationFlowMode): void {
    if (flowMode === this.store.flowMode()) {
      return;
    }

    this.store.setFlowMode(flowMode);
    this.systemsForSelectedGm.set([]);
    this.gmsForSelectedSystem.set([]);
    this.availableSlots.set([]);
  }

  selectBaseProduct(product: ISessionBookingProduct): void {
    this.store.setBookingMode(this.resolveBookingMode(product));
    this.store.selectBaseProduct(product.slug as SessionReservationBaseProductSlug);
  }

  selectCustomerEntitlement(id: string | null): void {
    if (!id || !this.store.requiresCustomerEntitlement()) {
      this.store.selectCustomerEntitlement(null);
      return;
    }

    const entitlement =
      this.customerEntitlements().find((item) => item.id === id) ?? null;

    if (!entitlement) {
      this.store.selectCustomerEntitlement(null);
      return;
    }

    const bookingMode = this.store.bookingMode();

    if (
      bookingMode === SESSION_BOOKING_MODES.PackageCredit &&
      entitlement.kind !== CUSTOMER_SESSION_ENTITLEMENT_KINDS.Package
    ) {
      this.store.selectCustomerEntitlement(null);
      return;
    }

    if (
      bookingMode === SESSION_BOOKING_MODES.SubscriptionCredit &&
      entitlement.kind !== CUSTOMER_SESSION_ENTITLEMENT_KINDS.Subscription
    ) {
      this.store.selectCustomerEntitlement(null);
      return;
    }

    this.store.selectCustomerEntitlement(id);
  }

  selectGm(gmId: string | null): void {
    if (gmId === this.store.selectedGmId()) {
      return;
    }

    this.store.selectGm(gmId);
    this.systemsForSelectedGm.set([]);
    this.availableSlots.set([]);
  }

  loadSystemsForSelectedGm(): Observable<ISystem[]> {
    const gmId = this.store.selectedGmId();

    if (!gmId) {
      this.systemsForSelectedGm.set([]);
      return of([]);
    }

    return this.reservation.getSystemsForGm(gmId).pipe(
      tap((systems) => {
        this.systemsForSelectedGm.set(systems);

        if (
          this.store.flowMode() === SESSION_RESERVATION_FLOW_MODES.GmFirst &&
          systems.length === 1
        ) {
          this.store.selectSystem(systems[0].id);
        }
      }),
    );
  }

  selectSystem(systemId: string | null): void {
    if (systemId === this.store.selectedSystemId()) {
      return;
    }

    this.store.selectSystem(systemId);
    this.gmsForSelectedSystem.set([]);
    this.availableSlots.set([]);
  }

  loadGmsForSelectedSystemAvailability(
    availabilityFromIso: string,
  ): Observable<IGmPublicProfile[]> {
    if (!this.store.selectedSystemId()) {
      this.gmsForSelectedSystem.set([]);
      return of([]);
    }

    return this.loadNextSlotsForSelectedSystem(availabilityFromIso).pipe(
      map((slots) => this.toUniqueGms(slots)),
      tap((gms) => this.gmsForSelectedSystem.set(gms)),
    );
  }

  selectSlot(date: string, startTime: string, durationHours: number): void {
    this.store.selectSlot(date, startTime, durationHours);
  }

  clearSlot(): void {
    this.store.clearSlot();
  }

  buildSummaryPreview(): ISessionReservationSummaryPreview | null {
    if (!this.store.isReadyForSummary()) return null;

    const state = this.store.state();
    const baseProduct = this.productBySlug().get(state.selectedBaseProductSlug);
    if (!baseProduct) return null;

    const addonProducts: ISessionBookingProduct[] = [];

    for (const slug of state.selectedAddonSlugs) {
      const addonProduct = this.productBySlug().get(slug);

      if (!addonProduct) return null;

      addonProducts.push(addonProduct);
    }

    const customerEntitlement = state.selectedCustomerEntitlementId
      ? (this.customerEntitlements().find(
          (entitlement) =>
            entitlement.id === state.selectedCustomerEntitlementId,
        ) ?? null)
      : null;

    if (this.store.requiresCustomerEntitlement() && !customerEntitlement) {
      return null;
    }

    const requiresManualQuote =
      this.store.requiresManualQuote() ||
      baseProduct.requiresManualQuote ||
      addonProducts.some((product) => product.requiresManualQuote);

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

  private resolveBookingMode(
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

  private toUniqueGms(
    slots: readonly ISessionReservationGmSlot[],
  ): IGmPublicProfile[] {
    return [
      ...new Map(
        slots.map((slot) => [slot.gm.profile.id, slot.gm]),
      ).values(),
    ];
  }

  private isSelectedGmValidForCurrentSystem(): boolean {
    const state = this.store.state();

    if (!state.selectedGmId || !state.selectedSystemId) {
      return false;
    }

    if (state.flowMode === SESSION_RESERVATION_FLOW_MODES.SystemFirst) {
      return this.gmsForSelectedSystem().some(
        (gm) => gm.profile.id === state.selectedGmId,
      );
    }

    return this.systemsForSelectedGm().some(
      (system) => system.id === state.selectedSystemId,
    );
  }
}
