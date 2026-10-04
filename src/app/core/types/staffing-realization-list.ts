import type { StaffingRealizationStatus, StaffingRealizationType } from './staffing-realization';

export type StaffingRealizationListFilters = {
  searchText: string;
  date: Date | null;
  type: StaffingRealizationType | null;
  status: StaffingRealizationStatus | null;
};
