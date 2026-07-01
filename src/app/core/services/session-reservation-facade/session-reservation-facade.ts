import { inject, Injectable, signal } from '@angular/core';
import { forkJoin, Observable, of, tap } from 'rxjs';

import { SESSION_RESERVATION_FLOW_MODES } from '../../configs/session-reservation-flow-mode.config';
import {
  ICustomerSessionEntitlement,
  ICustomerSessionEntitlementLookup,
} from '../../interfaces/i-customer-session-entitlement';
import { IGmPublicProfile } from '../../interfaces/i-gm-public-profile';
import { ISessionBookingProduct } from '../../interfaces/i-session-booking-product';
import { ISessionReservationAvailableSlot } from '../../interfaces/i-session-reservation-availability';
import {
  ISessionReservationInitialOptions,
  ISessionReservationSummaryPreview,
} from '../../interfaces/i-session-reservation-flow';
import { ISystem } from '../../interfaces/i-system';
import { SessionReservationBaseProductSlug } from '../../types/session-booking-product';
import { SessionReservationFlowMode } from '../../types/session-reservation-flow-mode';
import { resolveSessionBookingMode } from '../../utils/session-pricing';
import { SessionReservationAvailabilityService } from '../session-reservation-availability/session-reservation-availability';
import { SessionReservationEntitlementService } from '../session-reservation-entitlement/session-reservation-entitlement';
import { SessionReservationStore } from '../session-reservation-store/session-reservation-store';
import { SessionReservationService } from '../session-reservation/session-reservation';
import { SessionReservationSummaryService } from '../session-reservation-summary/session-reservation-summary';

@Injectable({ providedIn: 'root' })
export class SessionReservationFacade {
  private readonly reservation = inject(SessionReservationService);
  private readonly availability = inject(SessionReservationAvailabilityService);
  private readonly entitlement = inject(SessionReservationEntitlementService);
  private readonly summary = inject(SessionReservationSummaryService);

  readonly store = inject(SessionReservationStore);

  readonly products = signal<readonly ISessionBookingProduct[]>([]);
  readonly activeSystems = signal<readonly ISystem[]>([]);
  readonly visibleGms = signal<readonly IGmPublicProfile[]>([]);
  readonly systemsForSelectedGm = signal<readonly ISystem[]>([]);
  readonly gmsForSelectedSystem = signal<readonly IGmPublicProfile[]>([]);
  readonly availableSlots = signal<readonly ISessionReservationAvailableSlot[]>([]);
  readonly customerEntitlements = signal<readonly ICustomerSessionEntitlement[]>([]);

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
        this.store.selectCustomerEntitlement(
          this.entitlement.resolveSelectedEntitlementId(
            this.store.selectedCustomerEntitlementId(),
            entitlements,
            this.store.bookingMode(),
          ),
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

  loadAvailableSlotsForSelectedGm(): Observable<ISessionReservationAvailableSlot[]> {
    const gmId = this.store.selectedGmId();
    const systemId = this.store.selectedSystemId();

    if (!gmId || !systemId || !this.isSelectedGmValidForCurrentSystem()) {
      this.availableSlots.set([]);
      return of([]);
    }

    return this.availability
      .getNextReservationSlotsForGm(gmId, this.store.selectedDurationHours())
      .pipe(tap((slots) => this.availableSlots.set(slots)));
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
    this.store.setBookingMode(resolveSessionBookingMode(product));
    this.store.selectBaseProduct(product.slug as SessionReservationBaseProductSlug);
  }

  selectCustomerEntitlement(id: string | null): void {
    this.store.selectCustomerEntitlement(
      this.entitlement.resolveSelectedEntitlementId(
        id,
        this.customerEntitlements(),
        this.store.bookingMode(),
      ),
    );
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

  loadGmsForSelectedSystemAvailability(): Observable<IGmPublicProfile[]> {
    const systemId = this.store.selectedSystemId();

    if (!systemId) {
      this.gmsForSelectedSystem.set([]);
      return of([]);
    }

    return this.availability
      .getAvailableGmsForReservationSystem(
        systemId,
        this.store.selectedDurationHours(),
      )
      .pipe(tap((gms) => this.gmsForSelectedSystem.set(gms)));
  }

  selectSlot(date: string, startTime: string, durationHours: number): void {
    this.store.selectSlot(date, startTime, durationHours);
  }

  selectSlotDate(date: string | null): void {
    this.store.selectSlotDate(date);
  }

  clearSlot(): void {
    this.store.clearSlot();
  }

  buildSummaryPreview(): ISessionReservationSummaryPreview | null {
    return this.summary.buildSummaryPreview(
      this.store.state(),
      this.products(),
      this.customerEntitlements(),
    );
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
