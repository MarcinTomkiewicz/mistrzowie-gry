import { inject, Injectable, signal } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';

import { SESSION_RESERVATION_FLOW_MODES } from '../../configs/session-reservation-flow-mode.config';
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
} from '../../interfaces/i-session-reservation-flow';
import { ISystem } from '../../interfaces/i-system';
import { ISessionReservationFinalSummaryPreview } from '../../interfaces/i-session-reservation-finalization';
import { SessionReservationFlowMode } from '../../types/session-reservation-flow-mode';
import { isSessionReservationSelectedSlot } from '../../utils/session-reservation-slots';
import { SessionReservationAvailabilityService } from '../session-reservation-availability/session-reservation-availability';
import { SessionReservationEntitlementService } from '../session-reservation-entitlement/session-reservation-entitlement';
import { SessionReservationStore } from '../session-reservation-store/session-reservation-store';
import { SessionReservationSummaryService } from '../session-reservation-summary/session-reservation-summary';
import { SessionReservationService } from '../session-reservation/session-reservation';

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
  readonly availableSlots = signal<readonly ISessionReservationAvailableSlot[]>(
    [],
  );
  readonly nearestSystemSlots = signal<readonly ISessionReservationGmSlot[]>(
    [],
  );
  readonly otherGmsForSelectedSlot = signal<readonly IGmPublicProfile[]>([]);
  readonly customerEntitlements = signal<
    readonly ICustomerSessionEntitlement[]
  >([]);
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
  resetReservationFlow(clearInitialOptions = false): void {
    this.store.reset();

    if (clearInitialOptions) {
      this.products.set([]);
      this.activeSystems.set([]);
      this.visibleGms.set([]);
    }

    this.systemsForSelectedGm.set([]);
    this.gmsForSelectedSystem.set([]);
    this.availableSlots.set([]);
    this.clearFallbackOptions();
    this.customerEntitlements.set([]);
  }
  loadSlotsForSelectedGm(): Observable<void> {
    const gmId = this.store.selectedGmId();
    const systemId = this.store.selectedSystemId();
    const durationHours = this.store.selectedDurationHours();

    this.clearFallbackOptions();

    if (!gmId || !systemId || !this.isSelectedGmValidForCurrentSystem()) {
      this.availableSlots.set([]);
      return of(void 0);
    }

    return this.availability
      .getNextReservationSlotsForGm(gmId, durationHours)
      .pipe(
        switchMap((slots) => {
          this.availableSlots.set(slots);

          if (slots.length) {
            return of(void 0);
          }

          return this.availability
            .getNearestFallbackSlotsForReservationSystem(
              systemId,
              durationHours,
              gmId,
              SESSION_RESERVATION_CONFIG.fallbackSlotsLimit,
            )
            .pipe(
              tap((slots) => this.nearestSystemSlots.set(slots)),
              map(() => void 0),
            );
        }),
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
    this.clearFallbackOptions();
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
    this.clearFallbackOptions();
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

    const shouldPreserveFallbackGm =
      !!systemId &&
      this.store.flowMode() === SESSION_RESERVATION_FLOW_MODES.SystemFirst &&
      !this.store.selectedSystemId() &&
      !!this.store.selectedGmId() &&
      this.systemsForSelectedGm().some((system) => system.id === systemId);

    if (shouldPreserveFallbackGm) {
      this.store.selectSystemForSelectedGm(systemId);
    } else {
      this.store.selectSystem(systemId);
    }

    this.gmsForSelectedSystem.set([]);
    this.availableSlots.set([]);
    this.clearFallbackOptions();
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

  selectSlotAndLoadFallbackGms(
    slot: ISessionReservationAvailableSlot,
  ): Observable<void> {
    this.store.selectSlot(slot.date, slot.startTime, slot.durationHours);
    this.otherGmsForSelectedSlot.set([]);

    return this.availability
      .getAvailableGmsForReservationSlot(
        slot.date,
        slot.startTime,
        slot.durationHours,
        this.store.selectedGmId(),
      )
      .pipe(
        tap((gms) => {
          if (
            isSessionReservationSelectedSlot(
              slot,
              this.store.selectedGmId(),
              this.store.selectedDate(),
              this.store.selectedStartTime(),
              this.store.selectedDurationHours(),
            )
          ) {
            this.otherGmsForSelectedSlot.set(gms);
          }
        }),
        map(() => void 0),
      );
  }

  selectSlotDate(date: string | null): void {
    this.store.selectSlotDate(date);
    this.otherGmsForSelectedSlot.set([]);
  }

  selectNearestSystemSlot(slot: ISessionReservationGmSlot): void {
    const systemId = this.store.selectedSystemId();
    const selectedSystem = this.activeSystems().find(
      (system) => system.id === systemId,
    );

    this.systemsForSelectedGm.set(selectedSystem ? [selectedSystem] : []);
    this.store.selectFallbackSystemSlot(
      slot.gmProfileId,
      slot.date,
      slot.startTime,
      slot.durationHours,
    );
    this.availableSlots.set([slot]);
    this.clearFallbackOptions();
  }

  selectOtherGmForSelectedSlot(gmId: string): Observable<boolean> {
    const selectedSystemId = this.store.selectedSystemId();

    return this.reservation.getSystemsForGm(gmId).pipe(
      switchMap((systems) => {
        const preservesSelectedSystem =
          !!selectedSystemId &&
          systems.some((system) => system.id === selectedSystemId);

        this.systemsForSelectedGm.set(systems);
        this.store.selectFallbackGm(gmId, preservesSelectedSystem);

        if (!preservesSelectedSystem) {
          this.availableSlots.set([]);
          this.clearFallbackOptions();
          return of(false);
        }

        return this.availability
          .getNextReservationSlotsForGm(
            gmId,
            this.store.selectedDurationHours(),
          )
          .pipe(
            tap((slots) => {
              this.availableSlots.set(slots);
              this.clearFallbackOptions();
            }),
            map(() => true),
          );
      }),
    );
  }

  buildSummaryPreview(): ISessionReservationFinalSummaryPreview | null {
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

  private clearFallbackOptions(): void {
    this.nearestSystemSlots.set([]);
    this.otherGmsForSelectedSlot.set([]);
  }
}
