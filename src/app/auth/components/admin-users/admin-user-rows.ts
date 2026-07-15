import {
  IAdminUserRow,
  IAdminUsersFilterValue,
} from '../../../core/interfaces/i-admin-users';
import { normalizeText } from '../../../core/utils/normalize-text';
import { stablePartition } from '../../../core/utils/stable-partition';

export function getVisibleAdminUserRows(
  rows: readonly IAdminUserRow[],
  filters: IAdminUsersFilterValue,
): IAdminUserRow[] {
  return sortAdminUserRowsArchivedLast(
    rows.filter((row) => matchesAdminUserFilters(row, filters)),
  );
}

function matchesAdminUserFilters(
  row: IAdminUserRow,
  filters: IAdminUsersFilterValue,
): boolean {
  const query = normalizeText(filters.searchText)?.toLowerCase() ?? '';
  const user = row.user;
  const profile = row.gmProfile;

  if (
    query &&
    ![user.email, user.firstName, user.nickname].some((value) => {
      const normalizedValue = normalizeText(value)?.toLowerCase();

      return normalizedValue ? normalizedValue.includes(query) : false;
    })
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

function sortAdminUserRowsArchivedLast(
  rows: readonly IAdminUserRow[],
): IAdminUserRow[] {
  return stablePartition(rows, (row) => !row.gmProfile?.isArchived);
}
