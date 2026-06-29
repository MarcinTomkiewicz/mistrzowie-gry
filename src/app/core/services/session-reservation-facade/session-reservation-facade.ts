import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin, map, Observable, of, tap } from 'rxjs';

import { SESSION_RESERVATION_CONFIG } from '../../configs/session-reservation.config';
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
import { SESSION_CUSTOM_ADDITIONAL_SERVICE_PRODUCT_SLUG } from '../../types/session-booking-product';
import {
  SESSION_RESERVATION_FLOW_MODES,
  SessionReservationFlowMode,
} from '../../types/session-reservation-flow-mode';
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
  readonly availableSlots = signal<readonly ISessionReservationAvailableSlot[]>(
    [],
  );
  readonly nextSlotsForSelectedSystem = signal<
    readonly ISessionReservationGmSlot[]
  >([]);
  readonly customerEntitlements = signal<
    readonly ICustomerSessionEntitlement[]
  >([]);

  private readonly productBySlug = computed(
    () =>
      new Map(
        this.products().map((product) => [product.slug, product] as const),
      ),
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

  loadAvailableSlotsForSelectedGm(
    fromIso: string,
    toIsoExclusive: string,
  ): Observable<ISessionReservationAvailableSlot[]> {
    const gmId = this.store.selectedGmId();

    if (!gmId) {
      this.availableSlots.set([]);
      return of([]);
    }

    return this.availability
      .getAvailableSlotsForGm(
        gmId,
        fromIso,
        toIsoExclusive,
        this.store.selectedDurationHours(),
      )
      .pipe(tap((slots) => this.availableSlots.set(slots)));
  }

  loadNextSlotsForSelectedSystem(
    fromIso: string,
  ): Observable<ISessionReservationGmSlot[]> {
    const systemId = this.store.selectedSystemId();

    if (!systemId) {
      this.nextSlotsForSelectedSystem.set([]);
      return of([]);
    }

    return this.availability
      .getNextSlotsForSystem(
        systemId,
        fromIso,
        this.store.selectedDurationHours(),
      )
      .pipe(tap((slots) => this.nextSlotsForSelectedSystem.set(slots)));
  }

  selectFlowMode(flowMode: SessionReservationFlowMode): void {
    this.store.setFlowMode(flowMode);
    this.systemsForSelectedGm.set([]);
    this.gmsForSelectedSystem.set([]);
    this.availableSlots.set([]);
    this.nextSlotsForSelectedSystem.set([]);
  }

  selectBookingMode(bookingMode: SessionBookingMode): void {
    const previousBaseProductSlug = this.store.selectedBaseProductSlug();

    this.store.setBookingMode(bookingMode);

    if (bookingMode === SESSION_BOOKING_MODES.CustomQuote) {
      this.store.selectBaseProduct(
        SESSION_CUSTOM_ADDITIONAL_SERVICE_PRODUCT_SLUG,
      );
      return;
    }

    if (
      previousBaseProductSlug === SESSION_CUSTOM_ADDITIONAL_SERVICE_PRODUCT_SLUG
    ) {
      this.store.selectBaseProduct(
        SESSION_RESERVATION_CONFIG.defaultBaseProductSlug,
      );
    }
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

  selectGm(gmId: string | null): Observable<ISystem[]> {
    this.store.selectGm(gmId);
    this.systemsForSelectedGm.set([]);
    this.availableSlots.set([]);

    if (!gmId) return of([]);

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

  selectSystem(systemId: string | null): Observable<IGmPublicProfile[]> {
    this.store.selectSystem(systemId);
    this.gmsForSelectedSystem.set([]);
    this.nextSlotsForSelectedSystem.set([]);

    if (!systemId) return of([]);

    return this.reservation
      .getGmsForSystem(systemId)
      .pipe(tap((gms) => this.gmsForSelectedSystem.set(gms)));
  }

  clearSlot(): void {
    this.store.clearSlot();
    this.availableSlots.set([]);
    this.nextSlotsForSelectedSystem.set([]);
  }

  syncSelectedGmWithCurrentSlot(): Observable<boolean> {
    const state = this.store.state();

    if (
      !state.selectedGmId ||
      !state.selectedDate ||
      !state.selectedStartTime
    ) {
      return of(false);
    }

    const availableGms$ = state.selectedSystemId
      ? this.availability.getAvailableGmsForSystemSlot(
          state.selectedSystemId,
          state.selectedDate,
          state.selectedStartTime,
          state.selectedDurationHours,
        )
      : this.availability.getAvailableGmsForSlot(
          state.selectedDate,
          state.selectedStartTime,
          state.selectedDurationHours,
        );

    return availableGms$.pipe(
      tap((gms) => {
        if (state.selectedSystemId) this.gmsForSelectedSystem.set(gms);
      }),
      map((gms) => gms.some((gm) => gm.profile.id === state.selectedGmId)),
      tap((isValid) => {
        if (!isValid) this.store.clearGm();
      }),
    );
  }

  syncSelectedSystemWithCurrentGm(): Observable<boolean> {
    const state = this.store.state();

    if (!state.selectedGmId || !state.selectedSystemId) return of(false);

    return this.reservation.getSystemsForGm(state.selectedGmId).pipe(
      tap((systems) => this.systemsForSelectedGm.set(systems)),
      map((systems) =>
        systems.some((system) => system.id === state.selectedSystemId),
      ),
      tap((isValid) => {
        if (!isValid) this.store.clearSystem();
      }),
    );
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
}
