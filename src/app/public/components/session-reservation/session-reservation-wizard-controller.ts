import {
  DestroyRef,
  Injectable,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, type Observable } from 'rxjs';

import { SESSION_RESERVATION_FLOW_MODES } from '../../../core/configs/session-reservation-flow-mode.config';
import { SESSION_RESERVATION_CONFIG } from '../../../core/configs/session-reservation.config';
import {
  ISessionReservationAvailableSlot,
  ISessionReservationGmSlot,
} from '../../../core/interfaces/i-session-reservation-availability';
import { SessionReservationFacade } from '../../../core/services/session-reservation-facade/session-reservation-facade';
import { SessionReservationFlowMode } from '../../../core/types/session-reservation-flow-mode';
import {
  SESSION_RESERVATION_WIZARD_STEPS,
  SessionReservationWizardStep,
} from '../../../core/types/session-reservation-wizard';
import { isSessionReservationSelectedSlot } from '../../../core/utils/session-reservation-slots';
import { createSessionReservationI18n } from './session-reservation.i18n';

@Injectable()
export class SessionReservationWizardController {
  private readonly facade = inject(SessionReservationFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = createSessionReservationI18n();

  readonly store = this.facade.store;
  readonly wizardSteps = SESSION_RESERVATION_WIZARD_STEPS;
  readonly activeWizardStep = signal<SessionReservationWizardStep>(
    SESSION_RESERVATION_WIZARD_STEPS.Offer,
  );
  readonly isLoadingSystems = signal(false);
  readonly isLoadingSlots = signal(false);
  readonly isLoadingGms = signal(false);
  private readonly loadErrorSource = signal<string | null>(null);
  readonly loadError = computed(() => this.loadErrorSource());

  readonly orderedWizardSteps = computed(() =>
    this.store.flowMode() === SESSION_RESERVATION_FLOW_MODES.SystemFirst
      ? [
          SESSION_RESERVATION_WIZARD_STEPS.Offer,
          SESSION_RESERVATION_WIZARD_STEPS.System,
          SESSION_RESERVATION_WIZARD_STEPS.Gm,
          SESSION_RESERVATION_WIZARD_STEPS.Slot,
          SESSION_RESERVATION_WIZARD_STEPS.Details,
        ]
      : [
          SESSION_RESERVATION_WIZARD_STEPS.Offer,
          SESSION_RESERVATION_WIZARD_STEPS.Gm,
          SESSION_RESERVATION_WIZARD_STEPS.System,
          SESSION_RESERVATION_WIZARD_STEPS.Slot,
          SESSION_RESERVATION_WIZARD_STEPS.Details,
        ],
  );

  readonly activeWizardStepOrdinal = computed(() =>
    this.wizardStepOrdinal(this.activeWizardStep()),
  );

  private readonly hasDefaultReservationProduct = computed(() =>
    this.facade
      .products()
      .some(
        (product) =>
          product.slug === SESSION_RESERVATION_CONFIG.defaultBaseProductSlug,
      ),
  );

  reset(): void {
    this.activeWizardStep.set(SESSION_RESERVATION_WIZARD_STEPS.Offer);
    this.isLoadingSystems.set(false);
    this.isLoadingSlots.set(false);
    this.isLoadingGms.set(false);
    this.clearLoadError();
  }

  setLoadError(message: string | null): void {
    this.loadErrorSource.set(message);
  }

  clearLoadError(): void {
    this.loadErrorSource.set(null);
  }

  private runBlockingLoad<T>(
    loader: Observable<T>,
    setLoading: (isLoading: boolean) => void,
    errorMessage: string,
    onSuccess?: (value: T) => void,
  ): void {
    this.clearLoadError();
    setLoading(true);

    loader
      .pipe(
        finalize(() => setLoading(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (value) => onSuccess?.(value),
        error: () => this.setLoadError(errorMessage),
      });
  }

  selectFlowMode(flowMode: SessionReservationFlowMode): void {
    if (flowMode === this.store.flowMode()) {
      return;
    }

    this.clearLoadError();
    this.isLoadingSystems.set(false);
    this.isLoadingSlots.set(false);
    this.isLoadingGms.set(false);
    this.facade.selectFlowMode(flowMode);
    this.activeWizardStep.set(SESSION_RESERVATION_WIZARD_STEPS.Offer);
  }

  selectGm(gmProfileId: string | null): void {
    this.clearLoadError();
    this.facade.selectGm(gmProfileId);
  }

  selectSystem(systemId: string | null): void {
    this.clearLoadError();
    this.facade.selectSystem(systemId);
  }

  loadSlots(): void {
    this.runBlockingLoad(
      this.facade.loadSlotsForSelectedGm(),
      (isLoading) => this.isLoadingSlots.set(isLoading),
      this.i18n.errors().slotsLoad,
    );
  }

  selectSlot(slot: ISessionReservationAvailableSlot): void {
    this.clearLoadError();
    this.facade
      .selectSlotAndLoadFallbackGms(slot)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          if (
            this.activeWizardStep() === SESSION_RESERVATION_WIZARD_STEPS.Slot &&
            isSessionReservationSelectedSlot(
              slot,
              this.store.selectedGmId(),
              this.store.selectedDate(),
              this.store.selectedStartTime(),
              this.store.selectedDurationHours(),
            )
          ) {
            this.setLoadError(this.i18n.errors().gmsForSlotLoad);
          }
        },
      });
  }

  selectSlotDate(date: string | null): void {
    this.clearLoadError();
    this.facade.selectSlotDate(date);
  }

  selectNearestSystemSlot(slot: ISessionReservationGmSlot): void {
    this.clearLoadError();
    this.facade.selectNearestSystemSlot(slot);
  }

  selectOtherGmForSelectedSlot(gmProfileId: string): void {
    this.runBlockingLoad(
      this.facade.selectOtherGmForSelectedSlot(gmProfileId),
      (isLoading) => this.isLoadingSystems.set(isLoading),
      this.i18n.errors().otherGmSelection,
      (preservesSelectedSystem) => {
        this.activeWizardStep.set(
          preservesSelectedSystem
            ? SESSION_RESERVATION_WIZARD_STEPS.Slot
            : SESSION_RESERVATION_WIZARD_STEPS.System,
        );
      },
    );
  }

  goToWizardStepOrdinal(ordinal: number | undefined): void {
    this.enterWizardStep(
      ordinal ? this.orderedWizardSteps()[ordinal - 1] : undefined,
    );
  }

  goToPreviousWizardStep(): void {
    this.goToRelativeWizardStep(-1);
  }

  goToNextWizardStep(): void {
    this.goToRelativeWizardStep(1);
  }

  private goToRelativeWizardStep(offset: number): void {
    const steps = this.orderedWizardSteps();
    const currentIndex = steps.indexOf(this.activeWizardStep());

    this.enterWizardStep(steps[currentIndex + offset]);
  }

  canEnterWizardStep(step: number | undefined): boolean {
    const state = this.store.state();
    const isSystemFirst =
      state.flowMode === SESSION_RESERVATION_FLOW_MODES.SystemFirst;

    switch (step) {
      case SESSION_RESERVATION_WIZARD_STEPS.Offer:
        return true;
      case SESSION_RESERVATION_WIZARD_STEPS.Gm:
        return isSystemFirst ? !!state.selectedSystemId : true;
      case SESSION_RESERVATION_WIZARD_STEPS.System:
        return isSystemFirst || !!state.selectedGmId;
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
    const isSystemFirst =
      state.flowMode === SESSION_RESERVATION_FLOW_MODES.SystemFirst;

    switch (this.activeWizardStep()) {
      case SESSION_RESERVATION_WIZARD_STEPS.Offer:
        return (
          !this.hasDefaultReservationProduct() ||
          !this.store.areSelectedAddonsComplete()
        );
      case SESSION_RESERVATION_WIZARD_STEPS.Gm:
        return (
          !state.selectedGmId ||
          (isSystemFirst ? this.isLoadingSlots() : this.isLoadingSystems())
        );
      case SESSION_RESERVATION_WIZARD_STEPS.System:
        return (
          !state.selectedSystemId ||
          (isSystemFirst ? this.isLoadingGms() : this.isLoadingSlots())
        );
      case SESSION_RESERVATION_WIZARD_STEPS.Slot:
        return (
          !state.selectedDate ||
          !state.selectedStartTime ||
          state.selectedDurationHours <= 0
        );
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

  wizardStepOrdinal(step: SessionReservationWizardStep): number {
    return this.orderedWizardSteps().indexOf(step) + 1;
  }

  private enterWizardStep(step: number | undefined): void {
    if (!this.isWizardStep(step) || !this.canEnterWizardStep(step)) {
      return;
    }

    const steps = this.orderedWizardSteps();
    const currentStep = this.activeWizardStep();
    const currentIndex = steps.indexOf(currentStep);
    const targetIndex = steps.indexOf(step);

    if (targetIndex <= currentIndex) {
      this.clearLoadError();
      this.activeWizardStep.set(step);
      return;
    }

    if (targetIndex !== currentIndex + 1 || this.isNextWizardStepDisabled()) {
      return;
    }

    const isSystemFirst =
      this.store.flowMode() === SESSION_RESERVATION_FLOW_MODES.SystemFirst;
    if (
      currentStep === SESSION_RESERVATION_WIZARD_STEPS.Gm &&
      step === SESSION_RESERVATION_WIZARD_STEPS.System &&
      !isSystemFirst
    ) {
      this.runBlockingLoad(
        this.facade.loadSystemsForSelectedGm(),
        (isLoading) => this.isLoadingSystems.set(isLoading),
        this.i18n.errors().systemsForGmLoad,
        () => this.activeWizardStep.set(step),
      );
      return;
    }

    if (
      currentStep === SESSION_RESERVATION_WIZARD_STEPS.System &&
      step === SESSION_RESERVATION_WIZARD_STEPS.Gm &&
      isSystemFirst
    ) {
      this.runBlockingLoad(
        this.facade.loadGmsForSelectedSystemAvailability(),
        (isLoading) => this.isLoadingGms.set(isLoading),
        this.i18n.errors().gmsForSystemLoad,
        () => this.activeWizardStep.set(step),
      );
      return;
    }

    if (
      step === SESSION_RESERVATION_WIZARD_STEPS.Slot &&
      ((currentStep === SESSION_RESERVATION_WIZARD_STEPS.System &&
        !isSystemFirst) ||
        (currentStep === SESSION_RESERVATION_WIZARD_STEPS.Gm && isSystemFirst))
    ) {
      this.runBlockingLoad(
        this.facade.loadSlotsForSelectedGm(),
        (isLoading) => this.isLoadingSlots.set(isLoading),
        this.i18n.errors().slotsLoad,
        () => this.activeWizardStep.set(step),
      );
      return;
    }

    this.clearLoadError();
    this.activeWizardStep.set(step);
  }
}
