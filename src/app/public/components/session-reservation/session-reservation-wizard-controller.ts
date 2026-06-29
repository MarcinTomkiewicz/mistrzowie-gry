import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { SESSION_RESERVATION_CONFIG } from '../../../core/configs/session-reservation.config';
import { ISessionReservationAvailableSlot } from '../../../core/interfaces/i-session-reservation-availability';
import { Auth } from '../../../core/services/auth/auth';
import { SessionReservationFacade } from '../../../core/services/session-reservation-facade/session-reservation-facade';
import {
  SESSION_RESERVATION_WIZARD_STEPS,
  SessionReservationWizardStep,
} from '../../../core/types/session-reservation-wizard';
import { addDays } from '../../../core/utils/date';
import { createSessionReservationI18n } from './session-reservation.i18n';

@Injectable()
export class SessionReservationWizardController {
  private readonly facade = inject(SessionReservationFacade);
  private readonly auth = inject(Auth);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = createSessionReservationI18n();

  readonly store = this.facade.store;
  readonly wizardSteps = SESSION_RESERVATION_WIZARD_STEPS;
  readonly activeWizardStep = signal<SessionReservationWizardStep>(
    SESSION_RESERVATION_WIZARD_STEPS.Offer,
  );
  readonly isLoadingSystems = signal(false);
  readonly isLoadingSlots = signal(false);
  readonly isLoadingEntitlements = signal(false);
  readonly loadError = signal<string | null>(null);

  private readonly hasDefaultReservationProduct = computed(() =>
    this.facade.products().some(
      (product) =>
        product.slug === SESSION_RESERVATION_CONFIG.defaultBaseProductSlug,
    ),
  );

  reset(): void {
    this.activeWizardStep.set(SESSION_RESERVATION_WIZARD_STEPS.Offer);
    this.isLoadingSystems.set(false);
    this.isLoadingSlots.set(false);
    this.isLoadingEntitlements.set(false);
    this.loadError.set(null);
  }

  setGenericLoadError(): void {
    this.loadError.set(this.i18n.commonErrors().generic);
  }

  selectGm(gmProfileId: string | null): void {
    this.loadError.set(null);
    this.isLoadingSystems.set(!!gmProfileId);

    this.facade
      .selectGm(gmProfileId)
      .pipe(
        finalize(() => this.isLoadingSystems.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          if (this.store.selectedSystemId()) {
            this.loadSlots();
          }
        },
        error: () => this.setGenericLoadError(),
      });
  }

  selectSystem(systemId: string | null): void {
    this.facade.clearSlot();
    this.store.selectSystem(systemId);
    this.loadSlots();
    this.goToWizardStep(SESSION_RESERVATION_WIZARD_STEPS.Slot);
  }

  loadSlots(): void {
    this.loadError.set(null);

    if (!this.store.selectedGmId()) {
      return;
    }

    const from = new Date(
      Date.now() + SESSION_RESERVATION_CONFIG.minLeadTimeHours * 60 * 60 * 1000,
    );
    const to = addDays(
      new Date(),
      SESSION_RESERVATION_CONFIG.bookingHorizonDays,
    );

    this.isLoadingSlots.set(true);

    this.facade
      .loadAvailableSlotsForSelectedGm(from.toISOString(), to.toISOString())
      .pipe(
        finalize(() => this.isLoadingSlots.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        error: () => this.setGenericLoadError(),
      });
  }

  selectSlot(slot: ISessionReservationAvailableSlot): void {
    this.store.selectSlot(slot.date, slot.startTime, slot.durationHours);
    this.goToWizardStep(SESSION_RESERVATION_WIZARD_STEPS.Details);
  }

  refreshEntitlements(): void {
    this.loadError.set(null);

    if (!this.store.requiresCustomerEntitlement()) {
      this.facade.selectCustomerEntitlement(null);
      return;
    }

    const userId = this.auth.userId();
    if (!userId) {
      this.loadError.set(this.i18n.commonErrors().unauthorized);
      return;
    }

    this.isLoadingEntitlements.set(true);

    this.facade
      .loadCustomerEntitlements({
        userId,
      })
      .pipe(
        finalize(() => this.isLoadingEntitlements.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        error: () => this.setGenericLoadError(),
      });
  }

  goToWizardStep(step: number | undefined): void {
    if (!this.isWizardStep(step)) {
      return;
    }

    if (!this.canEnterWizardStep(step)) {
      return;
    }

    this.activeWizardStep.set(step);
  }

  goToPreviousWizardStep(): void {
    this.goToWizardStep(
      (this.activeWizardStep() - 1) as SessionReservationWizardStep,
    );
  }

  goToNextWizardStep(): void {
    this.goToWizardStep(
      (this.activeWizardStep() + 1) as SessionReservationWizardStep,
    );
  }

  canEnterWizardStep(step: number | undefined): boolean {
    const state = this.store.state();

    switch (step) {
      case SESSION_RESERVATION_WIZARD_STEPS.Offer:
      case SESSION_RESERVATION_WIZARD_STEPS.Gm:
        return true;
      case SESSION_RESERVATION_WIZARD_STEPS.System:
        return !!state.selectedGmId;
      case SESSION_RESERVATION_WIZARD_STEPS.Slot:
        return !!state.selectedGmId && !!state.selectedSystemId;
      case SESSION_RESERVATION_WIZARD_STEPS.Details:
        return (
          !!state.selectedGmId &&
          !!state.selectedSystemId &&
          !!state.selectedDate &&
          !!state.selectedStartTime
        );
      default:
        return false;
    }
  }

  isNextWizardStepDisabled(): boolean {
    const state = this.store.state();

    switch (this.activeWizardStep()) {
      case SESSION_RESERVATION_WIZARD_STEPS.Offer:
        return (
          !this.hasDefaultReservationProduct() ||
          !this.areSelectedAddonsComplete()
        );
      case SESSION_RESERVATION_WIZARD_STEPS.Gm:
        return !state.selectedGmId || this.isLoadingSystems();
      case SESSION_RESERVATION_WIZARD_STEPS.System:
        return !state.selectedSystemId || this.isLoadingSlots();
      case SESSION_RESERVATION_WIZARD_STEPS.Slot:
        return !state.selectedDate || !state.selectedStartTime;
      case SESSION_RESERVATION_WIZARD_STEPS.Details:
        return true;
    }
  }

  private isWizardStep(
    step: number | undefined,
  ): step is SessionReservationWizardStep {
    return Object.values(SESSION_RESERVATION_WIZARD_STEPS).includes(
      step as SessionReservationWizardStep,
    );
  }

  private areSelectedAddonsComplete(): boolean {
    const state = this.store.state();
    const detailsRequired =
      SESSION_RESERVATION_CONFIG.addonProductSlugsRequiringCustomerDetails as readonly string[];
    const quantityRequired =
      SESSION_RESERVATION_CONFIG.addonProductSlugsRequiringQuantity as readonly string[];

    return state.selectedAddonSlugs.every((slug) => {
      const details = state.addonDetails[slug];
      const hasRequiredDetails =
        !detailsRequired.includes(slug) || !!details?.customerDetails?.trim();
      const hasRequiredQuantity =
        !quantityRequired.includes(slug) ||
        (typeof details?.quantity === 'number' && details.quantity > 0);

      return hasRequiredDetails && hasRequiredQuantity;
    });
  }
}
