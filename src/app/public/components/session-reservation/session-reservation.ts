import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { provideTranslocoScope } from '@jsverse/transloco';
import { finalize, startWith } from 'rxjs';

import { SESSION_RESERVATION_CONFIG } from '../../../core/configs/session-reservation.config';
import { ISessionBookingProduct } from '../../../core/interfaces/i-session-booking-product';
import { ISessionReservationAvailableSlot } from '../../../core/interfaces/i-session-reservation-availability';
import {
  ISessionReservationAddonCustomerDetailsChange,
  ISessionReservationAddonQuantityChange,
} from '../../../core/interfaces/i-session-reservation-flow';
import { SessionReservationFacade } from '../../../core/services/session-reservation-facade/session-reservation-facade';
import { Seo } from '../../../core/services/seo/seo';
import { SessionAddonProductSlug } from '../../../core/types/session-booking-product';
import { SESSION_RESERVATION_FLOW_MODES } from '../../../core/types/session-reservation-flow-mode';
import { addDays } from '../../../core/utils/date';
import { SessionReservationChoicePanel } from './session-reservation-choice-panel';
import { SessionReservationDetailsPanel } from './session-reservation-details-panel';
import { createSessionReservationI18n } from './session-reservation.i18n';
import { SessionReservationSummaryCard } from './session-reservation-summary-card';

@Component({
  selector: 'app-session-reservation',
  standalone: true,
  imports: [
    SessionReservationChoicePanel,
    SessionReservationDetailsPanel,
    SessionReservationSummaryCard,
  ],
  templateUrl: './session-reservation.html',
  providers: [provideTranslocoScope('sessionReservation', 'common')],
})
export class SessionReservation implements OnInit {
  private readonly facade = inject(SessionReservationFacade);
  private readonly seo = inject(Seo);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private lastCustomerEmail = '';

  readonly store = this.facade.store;
  readonly i18n = createSessionReservationI18n();

  readonly isLoadingInitial = signal(false);
  readonly isLoadingSystems = signal(false);
  readonly isLoadingSlots = signal(false);
  readonly isLoadingEntitlements = signal(false);
  readonly loadError = signal<string | null>(null);

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

  readonly baseProducts = computed(() =>
    this.facade.products().filter((product) =>
      (
        SESSION_RESERVATION_CONFIG.reservationBaseProductSlugs as readonly string[]
      ).includes(product.slug),
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
    baseProducts: this.baseProducts(),
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
        const customerEmail = value.customerEmail.trim();

        if (customerEmail !== this.lastCustomerEmail) {
          this.lastCustomerEmail = customerEmail;
          this.facade.clearCustomerEntitlements();
        }

        this.store.setContact({
          customerName: value.customerName,
          customerEmail,
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

  selectBaseProduct(product: ISessionBookingProduct): void {
    this.facade.selectBaseProduct(product);
  }

  selectGm(gmProfileId: string | null): void {
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
    this.store.selectSystem(systemId);
    this.loadSlots();
  }

  loadSlots(): void {
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
  }

  refreshEntitlements(): void {
    if (!this.store.requiresCustomerEntitlement()) {
      this.facade.selectCustomerEntitlement(null);
      return;
    }

    if (this.contactForm.controls.customerEmail.invalid) {
      this.contactForm.controls.customerEmail.markAsTouched();
      return;
    }

    this.isLoadingEntitlements.set(true);

    this.facade
      .loadCustomerEntitlements({
        customerEmail: this.contactForm.controls.customerEmail.value.trim(),
      })
      .pipe(
        finalize(() => this.isLoadingEntitlements.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        error: () => this.loadError.set(this.i18n.commonErrors().generic),
      });
  }

  selectCustomerEntitlement(id: string | null): void {
    this.facade.selectCustomerEntitlement(id);
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
