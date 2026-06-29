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
    reservationKind: string;
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
  };
  states: {
    emptyGms: string;
    selectGmFirst: string;
    emptySystemsForGm: string;
    selectGmForSlots: string;
    emptySlotsForGm: string;
    emptyAddons: string;
    emptyEntitlements: string;
    summaryNotReady: string;
    manualQuoteRequired: string;
    fixedPrice: string;
  };
}

export interface ISessionReservationCommonI18n {
  commonActions: CommonActionsTranslations;
  commonErrors: CommonErrorsTranslations;
  commonStatus: CommonStatusTranslations;
}
