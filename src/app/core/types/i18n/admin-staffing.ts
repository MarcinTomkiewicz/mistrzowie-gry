import type { StaffingRealizationType } from '../staffing-realization';

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
    dateRange: string;
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
  };
};

export type AdminStaffingScheduleEditorCopy = {
  page: {
    travelHint: string;
  };
  section: AdminStaffingEditorSectionCopy;
  validation: {
    duplicateDate: string;
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
