import { computed, Injectable, signal } from '@angular/core';

import { SESSION_RESERVATION_CONFIG } from '../../configs/session-reservation.config';
import {
  SessionReservationFallbackModeEnum,
  SessionReservationStepEnum,
} from '../../enums/session-reservation-flow';
import { ISessionReservationContact } from '../../interfaces/i-session-reservation-contact';
import {
  ISessionReservationAddonDetails,
  ISessionReservationFlowState,
  ISessionReservationGmExtraInfo,
  SessionReservationAddonDetailsMap,
  SessionReservationFallbackMode,
  SessionReservationStep,
} from '../../interfaces/i-session-reservation-flow';
import {
  SESSION_BOOKING_MODES,
  SessionBookingMode,
} from '../../types/session-booking-mode';
import {
  SessionAddonProductSlug,
  SessionReservationBaseProductSlug,
} from '../../types/session-booking-product';
import {
  SESSION_RESERVATION_FLOW_MODES,
  SessionReservationFlowMode,
} from '../../types/session-reservation-flow-mode';

@Injectable({ providedIn: 'root' })
export class SessionReservationStore {
  private readonly stateSource = signal<ISessionReservationFlowState>(
    this.createInitialState(),
  );

  readonly state = computed(() => this.stateSource());

  readonly flowMode = computed(() => this.state().flowMode);
  readonly bookingMode = computed(() => this.state().bookingMode);
  readonly step = computed(() => this.state().step);
  readonly selectedBaseProductSlug = computed(
    () => this.state().selectedBaseProductSlug,
  );
  readonly selectedAddonSlugs = computed(() => this.state().selectedAddonSlugs);
  readonly selectedCustomerEntitlementId = computed(
    () => this.state().selectedCustomerEntitlementId,
  );
  readonly selectedGmId = computed(() => this.state().selectedGmId);
  readonly selectedSystemId = computed(() => this.state().selectedSystemId);
  readonly selectedDate = computed(() => this.state().selectedDate);
  readonly selectedStartTime = computed(() => this.state().selectedStartTime);
  readonly selectedDurationHours = computed(
    () => this.state().selectedDurationHours,
  );
  readonly contact = computed(() => this.state().contact);
  readonly playersCount = computed(() => this.state().playersCount);
  readonly gmExtraInfo = computed(() => this.state().gmExtraInfo);
  readonly addonDetails = computed(() => this.state().addonDetails);
  readonly customServicesRequest = computed(
    () => this.state().customServicesRequest,
  );
  readonly fallbackMode = computed(() => this.state().fallbackMode);

  readonly requiresCustomerEntitlement = computed(
    () =>
      this.bookingMode() === SESSION_BOOKING_MODES.PackageCredit ||
      this.bookingMode() === SESSION_BOOKING_MODES.SubscriptionCredit,
  );

  readonly requiresManualQuote = computed(() => {
    const state = this.state();
    const manualQuoteSlugs =
      SESSION_RESERVATION_CONFIG.manualQuoteProductSlugs as readonly string[];

    return (
      state.bookingMode === SESSION_BOOKING_MODES.CustomQuote ||
      manualQuoteSlugs.includes(state.selectedBaseProductSlug) ||
      state.selectedAddonSlugs.some((slug) => manualQuoteSlugs.includes(slug))
    );
  });

  readonly isReadyForSummary = computed(() => {
    const state = this.state();
    const contact = state.contact;
    const extraInfo = state.gmExtraInfo;
    const detailsRequired =
      SESSION_RESERVATION_CONFIG.addonProductSlugsRequiringCustomerDetails as readonly string[];
    const quantityRequired =
      SESSION_RESERVATION_CONFIG.addonProductSlugsRequiringQuantity as readonly string[];

    return (
      !!state.selectedGmId &&
      !!state.selectedSystemId &&
      !!state.selectedDate &&
      !!state.selectedStartTime &&
      contact.customerName.trim().length > 0 &&
      contact.customerEmail.trim().length > 0 &&
      (!extraInfo.provideCharacterGuidelines ||
        !!extraInfo.characterGuidelines?.trim()) &&
      (!this.requiresManualQuote() || !!state.customServicesRequest?.trim()) &&
      (!this.requiresCustomerEntitlement() ||
        !!state.selectedCustomerEntitlementId) &&
      state.selectedAddonSlugs.every((slug) => {
        const details = state.addonDetails[slug];
        const hasRequiredDetails =
          !detailsRequired.includes(slug) || !!details?.customerDetails?.trim();
        const hasRequiredQuantity =
          !quantityRequired.includes(slug) ||
          (typeof details?.quantity === 'number' && details.quantity > 0);

        return hasRequiredDetails && hasRequiredQuantity;
      })
    );
  });

  reset(): void {
    this.stateSource.set(this.createInitialState());
  }

  setFlowMode(flowMode: SessionReservationFlowMode): void {
    this.patch({
      flowMode,
      selectedGmId: null,
      selectedSystemId: null,
      selectedDate: null,
      selectedStartTime: null,
      fallbackMode: SessionReservationFallbackModeEnum.None,
    });
  }

  setBookingMode(bookingMode: SessionBookingMode): void {
    this.patch({
      bookingMode,
      selectedCustomerEntitlementId: null,
    });
  }

  setStep(step: SessionReservationStep): void {
    this.patch({ step });
  }

  selectBaseProduct(slug: SessionReservationBaseProductSlug): void {
    this.patch({
      selectedBaseProductSlug: slug,
      selectedAddonSlugs: [],
      addonDetails: {},
      customServicesRequest: null,
    });
  }

  toggleAddon(slug: SessionAddonProductSlug): void {
    const currentSlugs = this.selectedAddonSlugs();
    const selectedAddonSlugs = currentSlugs.includes(slug)
      ? currentSlugs.filter((selectedSlug) => selectedSlug !== slug)
      : [...currentSlugs, slug];

    const selected = new Set(selectedAddonSlugs);
    const addonDetails = Object.fromEntries(
      Object.entries(this.addonDetails()).filter(([key]) =>
        selected.has(key as SessionAddonProductSlug),
      ),
    ) as SessionReservationAddonDetailsMap;

    this.patch({ selectedAddonSlugs, addonDetails });
  }

  setAddonDetails(
    slug: SessionAddonProductSlug,
    details: ISessionReservationAddonDetails,
  ): void {
    if (!this.selectedAddonSlugs().includes(slug)) {
      return;
    }

    this.patch({
      addonDetails: {
        ...this.addonDetails(),
        [slug]: details,
      },
    });
  }

  selectCustomerEntitlement(id: string | null): void {
    this.patch({ selectedCustomerEntitlementId: id });
  }

  selectGm(gmId: string | null): void {
    const isGmFirst =
      this.flowMode() === SESSION_RESERVATION_FLOW_MODES.GmFirst;

    this.patch({
      selectedGmId: gmId,
      selectedSystemId: isGmFirst ? null : this.selectedSystemId(),
      selectedDate: isGmFirst ? null : this.selectedDate(),
      selectedStartTime: isGmFirst ? null : this.selectedStartTime(),
      fallbackMode: SessionReservationFallbackModeEnum.None,
    });
  }

  clearGm(): void {
    this.selectGm(null);
  }

  selectSystem(systemId: string | null): void {
    const isSystemFirst =
      this.flowMode() === SESSION_RESERVATION_FLOW_MODES.SystemFirst;

    this.patch({
      selectedSystemId: systemId,
      selectedGmId: isSystemFirst ? null : this.selectedGmId(),
      selectedDate: isSystemFirst ? null : this.selectedDate(),
      selectedStartTime: isSystemFirst ? null : this.selectedStartTime(),
      fallbackMode: SessionReservationFallbackModeEnum.None,
    });
  }

  clearSystem(): void {
    const isSystemFirst =
      this.flowMode() === SESSION_RESERVATION_FLOW_MODES.SystemFirst;

    this.patch({
      selectedSystemId: null,
      selectedGmId: isSystemFirst ? null : this.selectedGmId(),
      selectedDate: null,
      selectedStartTime: null,
      fallbackMode: SessionReservationFallbackModeEnum.None,
    });
  }

  selectSlot(
    date: string,
    startTime: string,
    durationHours: number = this.selectedDurationHours(),
  ): void {
    const isSystemFirst =
      this.flowMode() === SESSION_RESERVATION_FLOW_MODES.SystemFirst;

    this.patch({
      selectedDate: date,
      selectedStartTime: startTime,
      selectedDurationHours: durationHours,
      selectedGmId: isSystemFirst ? null : this.selectedGmId(),
      fallbackMode: SessionReservationFallbackModeEnum.None,
    });
  }

  clearSlot(): void {
    const isSystemFirst =
      this.flowMode() === SESSION_RESERVATION_FLOW_MODES.SystemFirst;

    this.patch({
      selectedDate: null,
      selectedStartTime: null,
      selectedGmId: isSystemFirst ? null : this.selectedGmId(),
      fallbackMode: SessionReservationFallbackModeEnum.None,
    });
  }

  setContact(contact: ISessionReservationContact): void {
    this.patch({ contact });
  }

  setPlayersCount(playersCount: number | null): void {
    this.patch({ playersCount });
  }

  setGmExtraInfo(gmExtraInfo: ISessionReservationGmExtraInfo): void {
    this.patch({ gmExtraInfo });
  }

  setCustomServicesRequest(customServicesRequest: string | null): void {
    this.patch({ customServicesRequest });
  }

  setFallbackMode(fallbackMode: SessionReservationFallbackMode): void {
    this.patch({ fallbackMode });
  }

  private patch(patch: Partial<ISessionReservationFlowState>): void {
    this.stateSource.update((state) => ({ ...state, ...patch }));
  }

  private createInitialState(): ISessionReservationFlowState {
    return {
      flowMode: SESSION_RESERVATION_FLOW_MODES.GmFirst,
      bookingMode: SESSION_RESERVATION_CONFIG.defaultBookingMode,
      step: SessionReservationStepEnum.Mode,
      selectedBaseProductSlug:
        SESSION_RESERVATION_CONFIG.defaultBaseProductSlug,
      selectedAddonSlugs: [],
      selectedCustomerEntitlementId: null,
      selectedGmId: null,
      selectedSystemId: null,
      selectedDate: null,
      selectedStartTime: null,
      selectedDurationHours: SESSION_RESERVATION_CONFIG.defaultDurationHours,
      contact: {
        customerName: '',
        customerEmail: '',
        customerPhone: null,
      },
      playersCount: null,
      gmExtraInfo: {
        message: null,
        createCharactersAtTable: false,
        provideCharacterGuidelines: false,
        characterGuidelines: null,
        extraNotes: null,
      },
      addonDetails: {},
      customServicesRequest: null,
      fallbackMode: SessionReservationFallbackModeEnum.None,
    };
  }
}
