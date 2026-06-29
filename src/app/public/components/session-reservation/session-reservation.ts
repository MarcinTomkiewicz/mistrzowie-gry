import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { provideTranslocoScope } from '@jsverse/transloco';
import { finalize, startWith } from 'rxjs';

import { SESSION_RESERVATION_CONFIG } from '../../../core/configs/session-reservation.config';
import { ISessionReservationAvailableSlot } from '../../../core/interfaces/i-session-reservation-availability';
import {
  ISessionReservationAddonCustomerDetailsChange,
  ISessionReservationAddonQuantityChange,
} from '../../../core/interfaces/i-session-reservation-flow';
import { Auth } from '../../../core/services/auth/auth';
import { SessionReservationFacade } from '../../../core/services/session-reservation-facade/session-reservation-facade';
import { Seo } from '../../../core/services/seo/seo';
import { SessionAddonProductSlug } from '../../../core/types/session-booking-product';
import { SESSION_RESERVATION_FLOW_MODES } from '../../../core/types/session-reservation-flow-mode';
import {
  SESSION_RESERVATION_WIZARD_STEPS,
  SessionReservationWizardStep,
} from '../../../core/types/session-reservation-wizard';
import { addDays } from '../../../core/utils/date';
import { ButtonModule } from 'primeng/button';
import { StepperModule } from 'primeng/stepper';
import { LoadingOverlay } from '../../common/loading-overlay/loading-overlay';
import { SessionReservationAddonsPanel } from './session-reservation-addons-panel';
import { SessionReservationChoicePanel } from './session-reservation-choice-panel';
import { SessionReservationDetailsPanel } from './session-reservation-details-panel';
import { SessionReservationGmPanel } from './session-reservation-gm-panel';
import { createSessionReservationI18n } from './session-reservation.i18n';
import { SessionReservationSlotPanel } from './session-reservation-slot-panel';
import { SessionReservationSummaryCard } from './session-reservation-summary-card';
import { SessionReservationSystemPanel } from './session-reservation-system-panel';
import { GmProfileDialog } from '../gm-profile-dialog/gm-profile-dialog';

@Component({
  selector: 'app-session-reservation',
  standalone: true,
  imports: [
    ButtonModule,
    StepperModule,
    LoadingOverlay,
    SessionReservationAddonsPanel,
    SessionReservationChoicePanel,
    SessionReservationDetailsPanel,
    SessionReservationGmPanel,
    SessionReservationSlotPanel,
    SessionReservationSummaryCard,
    SessionReservationSystemPanel,
    GmProfileDialog,
  ],
  templateUrl: './session-reservation.html',
  providers: [provideTranslocoScope('sessionReservation', 'common')],
})
export class SessionReservation implements OnInit {
  private readonly facade = inject(SessionReservationFacade);
  private readonly auth = inject(Auth);
  private readonly seo = inject(Seo);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly store = this.facade.store;
  readonly i18n = createSessionReservationI18n();

  readonly isLoadingInitial = signal(false);
  readonly isLoadingSystems = signal(false);
  readonly isLoadingSlots = signal(false);
  readonly isLoadingEntitlements = signal(false);
  readonly isGmProfileDialogVisible = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly wizardSteps = SESSION_RESERVATION_WIZARD_STEPS;
  readonly activeWizardStep = signal<SessionReservationWizardStep>(
    SESSION_RESERVATION_WIZARD_STEPS.Offer,
  );

  readonly contactForm = this.fb.nonNullable.group({
    customerName: this.fb.nonNullable.control('', Validators.required),
    customerEmail: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.email,
    ]),
    customerPhone: this.fb.nonNullable.control(''),
  });

  readonly gmExtraForm = this.fb.nonNullable.group({
    message: this.fb.nonNullable.control(''),
    createCharactersAtTable: this.fb.nonNullable.control(false),
    provideCharacterGuidelines: this.fb.nonNullable.control(false),
    characterGuidelines: this.fb.nonNullable.control(''),
    extraNotes: this.fb.nonNullable.control(''),
  });

  readonly playersCountControl = new FormControl<number | null>(null);
  readonly customServicesRequestControl = this.fb.nonNullable.control('');

  readonly hasDefaultReservationProduct = computed(() =>
    this.facade.products().some(
      (product) =>
        product.slug === SESSION_RESERVATION_CONFIG.defaultBaseProductSlug,
    ),
  );

  readonly addonProducts = computed(() =>
    this.facade.products().filter((product) =>
      (
        SESSION_RESERVATION_CONFIG.addonProductSlugs as readonly string[]
      ).includes(product.slug),
    ),
  );

  readonly selectedGm = computed(() => {
    const selectedGmId = this.store.selectedGmId();

    return (
      this.facade.visibleGms().find((gm) => gm.profile.id === selectedGmId) ??
      null
    );
  });

  readonly selectedSystem = computed(() => {
    const selectedSystemId = this.store.selectedSystemId();

    return (
      this.facade
        .systemsForSelectedGm()
        .find((system) => system.id === selectedSystemId) ?? null
    );
  });

  readonly summaryPreview = computed(() => this.facade.buildSummaryPreview());

  readonly vm = computed(() => ({
    seo: this.i18n.seo(),
    hero: this.i18n.hero(),
    sections: this.i18n.sections(),
    labels: this.i18n.labels(),
    states: this.i18n.states(),
    commonActions: this.i18n.commonActions(),
    commonStatus: this.i18n.commonStatus(),
    addonProducts: this.addonProducts(),
    visibleGms: this.facade.visibleGms(),
    systemsForSelectedGm: this.facade.systemsForSelectedGm(),
    availableSlots: this.facade.availableSlots(),
    customerEntitlements: this.facade.customerEntitlements(),
    selectedGm: this.selectedGm(),
    selectedSystem: this.selectedSystem(),
    summary: this.summaryPreview(),
    isLoadingInitial: this.isLoadingInitial(),
    isLoadingSystems: this.isLoadingSystems(),
    isLoadingSlots: this.isLoadingSlots(),
    isLoadingEntitlements: this.isLoadingEntitlements(),
    loadError: this.loadError(),
    requiresCustomerEntitlement: this.store.requiresCustomerEntitlement(),
    requiresManualQuote: this.store.requiresManualQuote(),
  }));

  constructor() {
    this.contactForm.valueChanges
      .pipe(
        startWith(this.contactForm.getRawValue()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        const value = this.contactForm.getRawValue();

        this.store.setContact({
          customerName: value.customerName,
          customerEmail: value.customerEmail.trim(),
          customerPhone: value.customerPhone.trim() || null,
        });
      });

    this.gmExtraForm.valueChanges
      .pipe(
        startWith(this.gmExtraForm.getRawValue()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        const value = this.gmExtraForm.getRawValue();

        this.store.setGmExtraInfo({
          message: value.message.trim() || null,
          createCharactersAtTable: value.createCharactersAtTable,
          provideCharacterGuidelines: value.provideCharacterGuidelines,
          characterGuidelines: value.characterGuidelines.trim() || null,
          extraNotes: value.extraNotes.trim() || null,
        });
      });

    this.playersCountControl.valueChanges
      .pipe(
        startWith(this.playersCountControl.value),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => this.store.setPlayersCount(value));

    this.customServicesRequestControl.valueChanges
      .pipe(
        startWith(this.customServicesRequestControl.value),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) =>
        this.store.setCustomServicesRequest(value.trim() || null),
      );
  }

  ngOnInit(): void {
    this.store.reset();
    this.activeWizardStep.set(SESSION_RESERVATION_WIZARD_STEPS.Offer);
    this.prefillContactFromAuthenticatedUser();
    this.facade.selectFlowMode(SESSION_RESERVATION_FLOW_MODES.GmFirst);
    this.isLoadingInitial.set(true);
    this.loadError.set(null);

    this.facade
      .loadInitialOptions()
      .pipe(
        finalize(() => this.isLoadingInitial.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.seo.apply(this.i18n.seo()),
        error: () => this.loadError.set(this.i18n.commonErrors().generic),
      });
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
        error: () => this.loadError.set(this.i18n.commonErrors().generic),
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
        error: () => this.loadError.set(this.i18n.commonErrors().generic),
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
        error: () => this.loadError.set(this.i18n.commonErrors().generic),
      });
  }

  private prefillContactFromAuthenticatedUser(): void {
    const user = this.auth.user();

    this.contactForm.reset({
      customerName: this.auth.displayName(),
      customerEmail: user?.email ?? '',
      customerPhone: user?.phoneNumber ?? '',
    });
  }

  selectCustomerEntitlement(id: string | null): void {
    this.facade.selectCustomerEntitlement(id);
  }

  openSelectedGmProfileDialog(): void {
    if (!this.selectedGm()) {
      return;
    }

    this.isGmProfileDialogVisible.set(true);
  }

  onGmProfileDialogVisibleChange(visible: boolean): void {
    this.isGmProfileDialogVisible.set(visible);
  }

  toggleAddon(slug: SessionAddonProductSlug): void {
    this.store.toggleAddon(slug);
  }

  setAddonCustomerDetails(
    change: ISessionReservationAddonCustomerDetailsChange,
  ): void {
    const details = this.store.addonDetails()[change.slug];

    this.store.setAddonDetails(change.slug, {
      customerDetails: change.customerDetails,
      quantity: details?.quantity ?? null,
    });
  }

  setAddonQuantity(change: ISessionReservationAddonQuantityChange): void {
    const details = this.store.addonDetails()[change.slug];

    this.store.setAddonDetails(change.slug, {
      customerDetails: details?.customerDetails ?? null,
      quantity: change.quantity,
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
