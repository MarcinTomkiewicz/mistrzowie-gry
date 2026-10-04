import type { StaffingRealizationType } from '../staffing-realization';
import type { StaffingRealizationTravelTermsDraft } from '../staffing-realization-editor-draft';

export type AdminStaffingEditorCopy = {
  page: {
    createTitle: string;
    editTitle: string;
    subtitle: string;
    loadErrorTitle: string;
    loadErrorDescription: string;
  };
  sections: {
    basic: AdminStaffingEditorSectionCopy;
    initialDays: AdminStaffingEditorSectionCopy;
    venue: AdminStaffingEditorSectionCopy;
    event: AdminStaffingEditorSectionCopy;
  };
  fields: {
    name: string;
    description: string;
    operationalNotes: string;
    venueName: string;
    venueAddress: string;
    timezone: string;
    type: string;
    event: string;
    dateRange: string;
  };
  validation: {
    nameRequired: string;
    timezoneRequired: string;
    typeRequired: string;
    dateRangeRequired: string;
    dateRange: string;
  };
  summary: {
    dayCount: string;
    requiredGmCount: string;
    dailyGmUnit: string;
  };
  types: Record<
    StaffingRealizationType,
    AdminStaffingRealizationTypeDescriptionCopy
  >;
  event: {
    placeholder: string;
    empty: string;
  };
  toast: {
    saveSuccessSummary: string;
    saveFailedSummary: string;
  };
};

export type AdminStaffingShellCopy = {
  tabs: {
    core: string;
    schedule: string;
    travelTerms: string;
  };
};

export type AdminStaffingScheduleEditorCopy = {
  page: {
    travelHint: string;
  };
  section: AdminStaffingEditorSectionCopy;
  labels: {
    day: string;
  };
  fields: {
    label: string;
    startTime: string;
    endTime: string;
  };
  actions: {
    addDay: string;
    addSlot: string;
    editDate: string;
    saveDraft: string;
  };
  summary: {
    title: string;
    dayCount: string;
    slotCount: string;
    dailyStaffingPositions: string;
    conflictCount: string;
  };
  emptySlots: string;
  validation: {
    daysRequired: string;
    dateRequired: string;
    dateInvalid: string;
    slotLabelRequired: string;
    slotStartRequired: string;
    slotEndRequired: string;
    slotStartFormat: string;
    slotEndFormat: string;
    duplicateDate: string;
    slotTimeRange: string;
    slotConflict: string;
  };
  toast: {
    loadFailedSummary: string;
    saveSuccessSummary: string;
    saveFailedSummary: string;
  };
};

export type AdminStaffingTravelTermsEditorCopy = {
  page: {
    description: string;
    stationaryHint: string;
    saveCoreTypeHint: string;
  };
  sections: {
    logistics: string;
    workTime: string;
    additionalNotes: string;
  };
  fields: Record<keyof StaffingRealizationTravelTermsDraft, string>;
  validation: {
    positiveNumber: string;
  };
  toast: {
    loadFailedSummary: string;
    saveSuccessSummary: string;
    saveFailedSummary: string;
  };
};

type AdminStaffingEditorSectionCopy = {
  title: string;
  description: string;
};

type AdminStaffingRealizationTypeDescriptionCopy = {
  description: string;
};
