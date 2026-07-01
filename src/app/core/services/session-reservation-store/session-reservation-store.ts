import { computed, inject, Injectable, signal } from '@angular/core';

import { SESSION_RESERVATION_FLOW_MODES } from '../../configs/session-reservation-flow-mode.config';
import { SESSION_RESERVATION_CONFIG } from '../../configs/session-reservation.config';
import { ISessionReservationContact } from '../../interfaces/i-session-reservation-contact';
import {
  ISessionReservationAddonDetails,
  ISessionReservationFlowState,
  ISessionReservationGmExtraInfo,
} from '../../interfaces/i-session-reservation-flow';
import { SessionBookingMode } from '../../types/session-booking-mode';
import {
  SessionAddonProductSlug,
  SessionReservationBaseProductSlug,
} from '../../types/session-booking-product';
import { SessionReservationAddonDetailsMap } from '../../types/session-reservation-addon-details';
import { SessionReservationFlowMode } from '../../types/session-reservation-flow-mode';
import { SessionReservationRulesService } from '../session-reservation-rules/session-reservation-rules';

@Injectable({ providedIn: 'root' })
export class SessionReservationStore {
  private readonly rules = inject(SessionReservationRulesService);
  private readonly stateSource = signal<ISessionReservationFlowState>(
    this.createInitialState(),
  );

  readonly state = computed(() => this.stateSource());

  readonly flowMode = computed(() => this.state().flowMode);
  readonly bookingMode = computed(() => this.state().bookingMode);
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

  readonly requiresCustomerEntitlement = computed(() =>
    this.rules.requiresCustomerEntitlement(this.state()),
  );

  readonly requiresManualQuote = computed(() =>
    this.rules.requiresManualQuote(this.state()),
  );

  readonly isReadyForSummary = computed(() =>
    this.rules.isReadyForSummary(this.state()),
  );

  readonly areSelectedAddonsComplete = computed(() =>
    this.rules.areSelectedAddonsComplete(this.state()),
  );

  reset(): void {
    this.stateSource.set(this.createInitialState());
  }

  setFlowMode(flowMode: SessionReservationFlowMode): void {
    if (flowMode === this.flowMode()) {
      return;
    }

    this.patch({
      flowMode,
      selectedGmId: null,
      selectedSystemId: null,
      selectedDate: null,
      selectedStartTime: null,
      selectedDurationHours: SESSION_RESERVATION_CONFIG.defaultDurationHours,
    });
  }

  setBookingMode(bookingMode: SessionBookingMode): void {
    this.patch({
      bookingMode,
      selectedCustomerEntitlementId: null,
    });
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
    if (gmId === this.selectedGmId()) {
      return;
    }

    const isGmFirst =
      this.flowMode() === SESSION_RESERVATION_FLOW_MODES.GmFirst;

    this.patch({
      selectedGmId: gmId,
      selectedSystemId: isGmFirst ? null : this.selectedSystemId(),
      selectedDate: null,
      selectedStartTime: null,
      selectedDurationHours: SESSION_RESERVATION_CONFIG.defaultDurationHours,
    });
  }

  selectSystem(systemId: string | null): void {
    if (systemId === this.selectedSystemId()) {
      return;
    }

    const isSystemFirst =
      this.flowMode() === SESSION_RESERVATION_FLOW_MODES.SystemFirst;

    this.patch({
      selectedSystemId: systemId,
      selectedGmId: isSystemFirst ? null : this.selectedGmId(),
      selectedDate: null,
      selectedStartTime: null,
      selectedDurationHours: SESSION_RESERVATION_CONFIG.defaultDurationHours,
    });
  }

  selectSlot(
    date: string,
    startTime: string,
    durationHours: number = this.selectedDurationHours(),
  ): void {
    this.patch({
      selectedDate: date,
      selectedStartTime: startTime,
      selectedDurationHours: durationHours,
    });
  }

  clearSlot(): void {
    this.patch({
      selectedDate: null,
      selectedStartTime: null,
      selectedDurationHours: SESSION_RESERVATION_CONFIG.defaultDurationHours,
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

  private patch(patch: Partial<ISessionReservationFlowState>): void {
    this.stateSource.update((state) => ({ ...state, ...patch }));
  }

  private createInitialState(): ISessionReservationFlowState {
    return {
      flowMode: SESSION_RESERVATION_FLOW_MODES.GmFirst,
      bookingMode: SESSION_RESERVATION_CONFIG.defaultBookingMode,
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
    };
  }
}
