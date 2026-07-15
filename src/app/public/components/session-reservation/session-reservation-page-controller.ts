import {
  DestroyRef,
  Injectable,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { SESSION_RESERVATION_FLOW_MODES } from '../../../core/configs/session-reservation-flow-mode.config';
import { SESSION_RESERVATION_CONFIG } from '../../../core/configs/session-reservation.config';
import {
  ISessionReservationAddonCustomerDetailsChange,
  ISessionReservationAddonQuantityChange,
} from '../../../core/interfaces/i-session-reservation-flow';
import { ISessionReservationViewModel } from '../../../core/interfaces/i-session-reservation-view-model';
import { Auth } from '../../../core/services/auth/auth';
import { SessionReservationFacade } from '../../../core/facades/session-reservation/session-reservation.facade';
import { Seo } from '../../../core/services/seo/seo';
import { SessionAddonProductSlug } from '../../../core/types/session-booking-product';
import { SessionReservationFlowMode } from '../../../core/types/session-reservation-flow-mode';
import { createSessionReservationI18n } from './session-reservation.i18n';
import { SessionReservationWizardController } from './session-reservation-wizard-controller';

@Injectable()
export class SessionReservationPageController {
  private readonly auth = inject(Auth);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(SessionReservationFacade);
  private readonly seo = inject(Seo);
  private readonly wizard = inject(SessionReservationWizardController);

  readonly store = this.facade.store;
  readonly i18n = createSessionReservationI18n();
  readonly isLoadingInitial = signal(false);
  readonly isLoadingEntitlements = signal(false);
  readonly isGmProfileDialogVisible = signal(false);

  readonly addonProducts = computed(() =>
    this.facade.products().filter((product) =>
      (
        SESSION_RESERVATION_CONFIG.addonProductSlugs as readonly string[]
      ).includes(product.slug),
    ),
  );

  readonly gmOptions = computed(() =>
    this.store.flowMode() === SESSION_RESERVATION_FLOW_MODES.SystemFirst
      ? this.facade.gmsForSelectedSystem()
      : this.facade.visibleGms(),
  );

  readonly systemOptions = computed(() => {
    if (this.store.flowMode() !== SESSION_RESERVATION_FLOW_MODES.SystemFirst) {
      return this.facade.systemsForSelectedGm();
    }

    if (this.store.selectedGmId() && !this.store.selectedSystemId()) {
      return this.facade.systemsForSelectedGm();
    }

    return this.facade.activeSystems();
  });

  readonly selectedGm = computed(() => {
    const selectedGmId = this.store.selectedGmId();

    return (
      this.facade
        .visibleGms()
        .find((gm) => gm.profile.id === selectedGmId) ?? null
    );
  });

  readonly selectedSystem = computed(() => {
    const selectedSystemId = this.store.selectedSystemId();

    return (
      this.systemOptions().find((system) => system.id === selectedSystemId) ??
      null
    );
  });

  readonly summaryPreview = computed(() => this.facade.buildSummaryPreview());

  readonly vm = computed<ISessionReservationViewModel>(() => ({
    hero: this.i18n.hero(),
    sections: this.i18n.sections(),
    labels: this.i18n.labels(),
    states: this.i18n.states(),
    commonActions: this.i18n.commonActions(),
    commonStatus: this.i18n.commonStatus(),
    addonProducts: this.addonProducts(),
    gmOptions: this.gmOptions(),
    systemOptions: this.systemOptions(),
    availableSlots: this.facade.availableSlots(),
    nearestSystemSlots: this.facade.nearestSystemSlots(),
    otherGmsForSelectedSlot: this.facade.otherGmsForSelectedSlot(),
    customerEntitlements: this.facade.customerEntitlements(),
    selectedGm: this.selectedGm(),
    selectedSystem: this.selectedSystem(),
    summary: this.summaryPreview(),
    isLoadingInitial: this.isLoadingInitial(),
    isLoadingSystems: this.wizard.isLoadingSystems(),
    isLoadingSlots: this.wizard.isLoadingSlots(),
    isLoadingGms: this.wizard.isLoadingGms(),
    isLoadingEntitlements: this.isLoadingEntitlements(),
    loadError: this.wizard.loadError(),
    requiresCustomerEntitlement: this.store.requiresCustomerEntitlement(),
    requiresManualQuote: this.store.requiresManualQuote(),
  }));

  initialize(): void {
    this.facade.resetReservationFlow(true);
    this.wizard.reset();
    this.isLoadingInitial.set(true);

    this.facade
      .loadInitialOptions()
      .pipe(
        finalize(() => this.isLoadingInitial.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.seo.apply(this.i18n.seo()),
        error: () =>
          this.wizard.setLoadError(this.i18n.errors().initialOptionsLoad),
      });
  }

  refreshEntitlements(): void {
    this.wizard.clearLoadError();

    if (!this.store.requiresCustomerEntitlement()) {
      this.facade.selectCustomerEntitlement(null);
      return;
    }

    const userId = this.auth.userId();

    if (!userId) {
      this.wizard.setLoadError(this.i18n.commonErrors().unauthorized);
      return;
    }

    this.isLoadingEntitlements.set(true);

    this.facade
      .loadCustomerEntitlements({ userId })
      .pipe(
        finalize(() => this.isLoadingEntitlements.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        error: () =>
          this.wizard.setLoadError(this.i18n.errors().entitlementsLoad),
      });
  }

  selectCustomerEntitlement(id: string | null): void {
    this.facade.selectCustomerEntitlement(id);
  }

  selectFlowMode(flowMode: SessionReservationFlowMode): void {
    this.wizard.selectFlowMode(flowMode);
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
