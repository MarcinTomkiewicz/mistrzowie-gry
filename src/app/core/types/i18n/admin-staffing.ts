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

type AdminStaffingEditorSectionCopy = {
  title: string;
  description: string;
};

type AdminStaffingRealizationTypeDescriptionCopy = {
  description: string;
};
