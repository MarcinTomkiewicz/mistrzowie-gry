import {
  IAdminUserRow,
  IAdminUsersFilterValue,
} from '../types/admin-users';
import { normalizeText } from './normalize-text';
import { stablePartition } from './stable-partition';

export function getVisibleAdminUserRows(
  rows: readonly IAdminUserRow[],
  filters: IAdminUsersFilterValue,
): IAdminUserRow[] {
  return sortAdminUserRowsArchivedLast(
    rows.filter((row) => matchesAdminUserFilters(row, filters)),
  );
}

export function matchesAdminUserFilters(
  row: IAdminUserRow,
  filters: IAdminUsersFilterValue,
): boolean {
  const query = normalizeText(filters.searchText)?.toLowerCase() ?? '';
  const user = row.user;
  const profile = row.gmProfile;

  if (
    query &&
    ![user.email, user.firstName, user.nickname]
      .map((value) => normalizeText(value)?.toLowerCase())
      .filter(Boolean)
      .some((value) => value!.includes(query))
  ) {
    return false;
  }

  if (filters.role !== 'all' && user.appRole !== filters.role) {
    return false;
  }

  if (filters.profile === 'with' && !profile) {
    return false;
  }

  if (filters.profile === 'without' && profile) {
    return false;
  }

  if (filters.public === 'public' && !profile?.isPublic) {
    return false;
  }

  if (filters.public === 'not_public' && (!profile || profile.isPublic)) {
    return false;
  }

  if (!filters.showArchived && profile?.isArchived) {
    return false;
  }

  return true;
}

export function sortAdminUserRowsArchivedLast(
  rows: readonly IAdminUserRow[],
): IAdminUserRow[] {
  return stablePartition(rows, (row) => !row.gmProfile?.isArchived);
}
