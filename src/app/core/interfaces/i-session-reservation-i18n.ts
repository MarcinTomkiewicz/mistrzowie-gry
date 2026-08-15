import {
  CommonActionsTranslations,
  CommonErrorsTranslations,
  CommonLabelsTranslations,
  CommonStatusTranslations,
} from '../types/i18n/common';
import { AppRoleLabels } from '../types/app-role';

export interface ISessionReservationI18nSections extends Record<string, unknown> {
  seo: {
    title: string;
    description: string;
  };
  hero: {
    title: string;
    subtitle: string;
  };
  sections: {
    offer: string;
    system: string;
    slot: string;
    addons: string;
    summary: string;
  };
  labels: {
    flowMode: string;
    gmFirstFlowMode: string;
    reservationKind: string;
    showSelectedGmProfile: string;
    customerName: string;
    playersCount: string;
    message: string;
    createCharactersAtTable: string;
    provideCharacterGuidelines: string;
    characterGuidelines: string;
    extraNotes: string;
    customServicesRequest: string;
    addonDetails: string;
    addonQuantity: string;
    entitlement: string;
    manualQuote: string;
    grossTotal: string;
    lineItems: string;
    additionalTime: string;
    hourShort: string;
    selectedSlot: string;
    selectFallbackSlot: string;
  };
  states: {
    emptyGms: string;
    emptyGmsForSystemAvailability: string;
    emptyActiveSystems: string;
    selectGmFirst: string;
    selectSystemForGms: string;
    selectSystemBeforeSlots: string;
    emptySystemsForGm: string;
    selectGmForSlots: string;
    emptySlotsForGm: string;
    emptySlotsForSelectedGmSystem: string;
    emptyAddons: string;
    emptyEntitlements: string;
    summaryNotReady: string;
    manualQuoteRequired: string;
    fixedPrice: string;
    longDurationWarning: string;
    createCharactersAtTableWarning: string;
    noAddonsSelected: string;
    noEntitlementSelected: string;
    noAdditionalTime: string;
    nearestSystemSlotsTitle: string;
    nearestSystemSlotsHint: string;
    otherGmsForSelectedSlotTitle: string;
    otherGmsForSelectedSlotHint: string;
    fallbackGmClearsSystemHint: string;
  };
  errors: {
    initialOptionsLoad: string;
    systemsForGmLoad: string;
    gmsForSystemLoad: string;
    gmsForSlotLoad: string;
    slotsLoad: string;
    entitlementsLoad: string;
    otherGmSelection: string;
  };
}

export interface ISessionReservationCommonI18n {
  commonActions: CommonActionsTranslations;
  commonErrors: CommonErrorsTranslations;
  commonLabels: CommonLabelsTranslations;
  commonStatus: CommonStatusTranslations;
  commonAppRoles: AppRoleLabels;
}
