import { FormControl, FormGroup, Validators } from '@angular/forms';

import {
  IAdminUserRow,
  IAdminUserUpdateFormValue,
} from '../../../core/interfaces/i-admin-users';
import {
  AdminUserDialogSelectField,
  AdminUserDialogTextField,
  AdminUserDialogToggleField,
  AdminUsersFilterSelectField,
  AdminUsersFilterSelectFieldVm,
} from '../../../core/interfaces/i-admin-users-config';
import {
  AdminUsersFilterSelectControlName,
  AdminUsersProfileFilter,
  AdminUsersPublicFilter,
  AdminUsersRoleFilter,
  AdminUsersSortField,
  AdminUsersSortOrder,
} from '../../../core/types/admin-users';
import {
  AdminUserDialogForm,
  AdminUsersFilterForm,
} from '../../../core/types/admin-users-form';
import {
  APP_ROLES,
  AppRole,
  AppRoleLabels,
} from '../../../core/types/app-role';
import { AdminUsersFiltersTranslations } from '../../../core/types/i18n/admin-users';
import { CommonLabelsTranslations } from '../../../core/types/i18n/common';
import { getAppRoleLabel } from '../../../core/utils/app-role-labels';

export const ADMIN_USERS_FILTER_SELECT_FIELDS: readonly AdminUsersFilterSelectField[] = [
  {
    controlName: 'role',
    inputId: 'admin-users-role',
    options: ['all', ...APP_ROLES],
  },
  {
    controlName: 'profile',
    inputId: 'admin-users-profile',
    options: ['all', 'with', 'without'],
  },
  {
    controlName: 'public',
    inputId: 'admin-users-public',
    options: ['all', 'public', 'not_public'],
  },
  {
    controlName: 'sortBy',
    inputId: 'admin-users-sort-by',
    options: ['createdAt', 'updatedAt'],
    reloadOnChange: true,
  },
  {
    controlName: 'sortOrder',
    inputId: 'admin-users-sort-order',
    options: ['desc', 'asc'],
    reloadOnChange: true,
  },
];

export const ADMIN_USER_DIALOG_SELECT_FIELDS: readonly AdminUserDialogSelectField[] = [
  {
    controlName: 'appRole',
    inputId: 'admin-user-role',
    options: APP_ROLES,
  },
];

export const ADMIN_USER_DIALOG_TEXT_FIELDS: readonly AdminUserDialogTextField[] = [
  {
    controlName: 'firstName',
    inputId: 'admin-user-first-name',
    type: 'text',
    autocomplete: 'given-name',
    maxLength: 100,
  },
  {
    controlName: 'nickname',
    inputId: 'admin-user-nickname',
    type: 'text',
    autocomplete: 'nickname',
    maxLength: 100,
  },
  {
    controlName: 'phoneNumber',
    inputId: 'admin-user-phone',
    type: 'tel',
    autocomplete: 'tel',
    maxLength: 50,
  },
  {
    controlName: 'city',
    inputId: 'admin-user-city',
    type: 'text',
    autocomplete: 'address-level2',
    maxLength: 100,
  },
];

export const ADMIN_USER_DIALOG_TOGGLE_FIELDS: readonly AdminUserDialogToggleField[] = [
  {
    controlName: 'useNickname',
    inputId: 'admin-user-use-nickname',
  },
  {
    controlName: 'isTestUser',
    inputId: 'admin-user-test',
  },
];

export function createAdminUsersFilterForm(): AdminUsersFilterForm {
  return new FormGroup({
    searchText: new FormControl('', { nonNullable: true }),
    role: new FormControl<AdminUsersRoleFilter>('all', { nonNullable: true }),
    profile: new FormControl<AdminUsersProfileFilter>('all', {
      nonNullable: true,
    }),
    public: new FormControl<AdminUsersPublicFilter>('all', {
      nonNullable: true,
    }),
    showArchived: new FormControl(false, { nonNullable: true }),
    sortBy: new FormControl<AdminUsersSortField>('createdAt', {
      nonNullable: true,
    }),
    sortOrder: new FormControl<AdminUsersSortOrder>('desc', {
      nonNullable: true,
    }),
  });
}

export function createAdminUserDialogForm(): AdminUserDialogForm {
  return new FormGroup({
    appRole: new FormControl<AppRole>('user', { nonNullable: true }),
    firstName: new FormControl<string | null>(null, [
      Validators.maxLength(100),
    ]),
    nickname: new FormControl<string | null>(null, [
      Validators.maxLength(100),
    ]),
    useNickname: new FormControl(false, { nonNullable: true }),
    phoneNumber: new FormControl<string | null>(null, [
      Validators.maxLength(50),
    ]),
    city: new FormControl<string | null>(null, [Validators.maxLength(100)]),
    isTestUser: new FormControl(false, { nonNullable: true }),
  });
}

export function getAdminUserDialogValue(
  row: IAdminUserRow,
): IAdminUserUpdateFormValue {
  return {
    appRole: row.user.appRole,
    firstName: row.user.firstName,
    nickname: row.user.nickname,
    useNickname: !!row.user.useNickname,
    phoneNumber: row.user.phoneNumber,
    city: row.user.city,
    isTestUser: !!row.user.isTestUser,
  };
}

export function createAdminUsersFilterSelectFieldVms(
  filters: AdminUsersFiltersTranslations,
  labels: CommonLabelsTranslations,
  roleLabels: AppRoleLabels,
): AdminUsersFilterSelectFieldVm[] {
  return ADMIN_USERS_FILTER_SELECT_FIELDS.map((field) => ({
    controlName: field.controlName,
    inputId: field.inputId,
    reloadOnChange: field.reloadOnChange,
    label: getAdminUsersFilterLabel(field.controlName, filters, labels),
    options: field.options.map((value) => ({
      value,
      label: getAdminUsersFilterOptionLabel(
        field.controlName,
        value,
        filters,
        labels,
        roleLabels,
      ),
    })),
  }));
}

function getAdminUsersFilterLabel(
  controlName: AdminUsersFilterSelectControlName,
  filters: AdminUsersFiltersTranslations,
  labels: CommonLabelsTranslations,
): string {
  if (controlName === 'role') return labels.role;
  if (controlName === 'profile') return labels.gmProfile;
  if (controlName === 'public') return labels.public;
  if (controlName === 'sortBy') return filters.sortLabel;
  return filters.sortOrderLabel;
}

function getAdminUsersFilterOptionLabel(
  controlName: AdminUsersFilterSelectControlName,
  value: string,
  filters: AdminUsersFiltersTranslations,
  labels: CommonLabelsTranslations,
  roleLabels: AppRoleLabels,
): string {
  switch (controlName) {
    case 'role': {
      if (value === 'all') return filters.roleAll;
      const role = APP_ROLES.find((appRole) => appRole === value);
      if (role) return getAppRoleLabel(role, roleLabels);
      break;
    }
    case 'profile':
      if (value === 'all') return filters.profileAll;
      if (value === 'with') return filters.profileWith;
      if (value === 'without') return filters.profileWithout;
      break;
    case 'public':
      if (value === 'all') return filters.publicAll;
      if (value === 'public') return labels.public;
      if (value === 'not_public') return filters.publicHidden;
      break;
    case 'sortBy':
      if (value === 'createdAt') return filters.sortCreatedAt;
      if (value === 'updatedAt') return filters.sortUpdatedAt;
      break;
    case 'sortOrder':
      if (value === 'desc') return filters.sortDesc;
      if (value === 'asc') return filters.sortAsc;
      break;
  }

  throw new Error(`Unsupported admin users filter option: ${controlName}.${value}`);
}
