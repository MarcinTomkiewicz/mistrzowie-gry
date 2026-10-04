import type { AdminStaffingRealizationListItem } from '../interfaces/admin-staffing-realization';
import type { StaffingRealizationListFilters } from '../types/staffing-realization-list';
import { toIsoDate } from './date';
import { normalizeText } from './normalize-text';

export function filterStaffingRealizations(
  realizations: readonly AdminStaffingRealizationListItem[],
  filters: StaffingRealizationListFilters,
): AdminStaffingRealizationListItem[] {
  const query = normalizeText(filters.searchText)?.toLocaleLowerCase('pl');
  const date = filters.date ? toIsoDate(filters.date) : null;

  return realizations.filter((item) =>
    (!query || [item.name, item.city].some((value) =>
      value?.toLocaleLowerCase('pl').includes(query),
    )) &&
    (!date || (item.startDate !== null && item.endDate !== null &&
      item.startDate <= date && date <= item.endDate)) &&
    (filters.type === null || item.type === filters.type) &&
    (filters.status === null || item.status === filters.status),
  );
}
