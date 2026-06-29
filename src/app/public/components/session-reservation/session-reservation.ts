import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { provideTranslocoScope } from '@jsverse/transloco';
import { finalize, startWith } from 'rxjs';

import { SESSION_RESERVATION_CONFIG } from '../../../core/configs/session-reservation.config';
import {
  ISessionReservationAddonCustomerDetailsChange,
  ISessionReservationAddonQuantityChange,
} from '../../../core/interfaces/i-session-reservation-flow';
import { Auth } from '../../../core/services/auth/auth';
import { SessionReservationFacade } from '../../../core/services/session-reservation-facade/session-reservation-facade';
import { Seo } from '../../../core/services/seo/seo';
import { SessionAddonProductSlug } from '../../../core/types/session-booking-product';
import { SESSION_RESERVATION_FLOW_MODES } from '../../../core/types/session-reservation-flow-mode';
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
import { SessionReservationWizardController } from './session-reservation-wizard-controller';
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
  providers: [
    provideTranslocoScope('sessionReservation', 'common'),
    SessionReservationWizardController,
  ],
})
export class SessionReservation implements OnInit {
  private readonly facade = inject(SessionReservationFacade);
  private readonly auth = inject(Auth);
  private readonly seo = inject(Seo);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly store = this.facade.store;
  readonly i18n = createSessionReservationI18n();
  readonly wizard = inject(SessionReservationWizardController);

  readonly isLoadingInitial = signal(false);
  readonly isGmProfileDialogVisible = signal(false);

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
    isLoadingSystems: this.wizard.isLoadingSystems(),
    isLoadingSlots: this.wizard.isLoadingSlots(),
    isLoadingEntitlements: this.wizard.isLoadingEntitlements(),
    loadError: this.wizard.loadError(),
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
    this.wizard.reset();
    this.prefillContactFromAuthenticatedUser();
    this.facade.selectFlowMode(SESSION_RESERVATION_FLOW_MODES.GmFirst);
    this.isLoadingInitial.set(true);

    this.facade
      .loadInitialOptions()
      .pipe(
        finalize(() => this.isLoadingInitial.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.seo.apply(this.i18n.seo()),
        error: () => this.wizard.setGenericLoadError(),
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

}
