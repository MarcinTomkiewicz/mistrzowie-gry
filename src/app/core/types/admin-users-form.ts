import { FormControl, FormGroup } from '@angular/forms';

import {
  AdminUsersProfileFilter,
  AdminUsersPublicFilter,
  AdminUsersRoleFilter,
  AdminUsersSortField,
  AdminUsersSortOrder,
} from './admin-users';
import { AppRole } from './app-role';

export type AdminUsersFilterForm = FormGroup<{
  searchText: FormControl<string>;
  role: FormControl<AdminUsersRoleFilter>;
  profile: FormControl<AdminUsersProfileFilter>;
  public: FormControl<AdminUsersPublicFilter>;
  showArchived: FormControl<boolean>;
  sortBy: FormControl<AdminUsersSortField>;
  sortOrder: FormControl<AdminUsersSortOrder>;
}>;

export type AdminUserDialogForm = FormGroup<{
  appRole: FormControl<AppRole>;
  firstName: FormControl<string | null>;
  nickname: FormControl<string | null>;
  useNickname: FormControl<boolean>;
  phoneNumber: FormControl<string | null>;
  city: FormControl<string | null>;
  isTestUser: FormControl<boolean>;
}>;
