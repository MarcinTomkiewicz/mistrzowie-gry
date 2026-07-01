import {
  CommonActionsTranslations,
  CommonErrorsTranslations,
  CommonStatusTranslations,
} from '../types/i18n/common';

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
    gm: string;
    system: string;
    slot: string;
    contact: string;
    addons: string;
    summary: string;
  };
  labels: {
    flowMode: string;
    gmFirstFlowMode: string;
    systemFirstFlowMode: string;
    reservationKind: string;
    showSelectedGmProfile: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
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
    selectedSlot: string;
    startTime: string;
    endTime: string;
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
    nearestSystemSlotsTitle: string;
    nearestSystemSlotsHint: string;
    otherGmsForSelectedSlotTitle: string;
    otherGmsForSelectedSlotHint: string;
    fallbackGmClearsSystemHint: string;
  };
}

export interface ISessionReservationCommonI18n {
  commonActions: CommonActionsTranslations;
  commonErrors: CommonErrorsTranslations;
  commonStatus: CommonStatusTranslations;
}
