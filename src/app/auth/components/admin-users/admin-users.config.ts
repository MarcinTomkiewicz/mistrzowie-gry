import { FormControl, FormGroup, Validators } from '@angular/forms';

import { ISelectOption } from '../../../core/interfaces/i-select-option';
import {
  AdminUsersProfileFilter,
  AdminUsersPublicFilter,
  AdminUsersRoleFilter,
  AdminUsersSortField,
  AdminUsersSortOrder,
  IAdminUserRow,
  IAdminUsersFilterValue,
  IAdminUserUpdateFormValue,
} from '../../../core/types/admin-users';
import { APP_ROLES, AppRole } from '../../../core/types/app-role';
import {
  AdminUsersDialogTranslations,
  AdminUsersFiltersTranslations,
} from '../../../core/types/i18n/admin-users';
import {
  AppRoleLabels,
  getAppRoleLabel,
} from '../../../core/utils/app-role-labels';

export type AdminUsersFilterForm = FormGroup<{
  searchText: FormControl<string>;
  role: FormControl<AdminUsersRoleFilter>;
  profile: FormControl<AdminUsersProfileFilter>;
  public: FormControl<AdminUsersPublicFilter>;
  showArchived: FormControl<boolean>;
  sortBy: FormControl<AdminUsersSortField>;
  sortOrder: FormControl<AdminUsersSortOrder>;
}>;

export type AdminUsersFilterSelectControlName = Exclude<
  keyof IAdminUsersFilterValue,
  'searchText' | 'showArchived'
>;

export interface AdminUsersFilterSelectField {
  controlName: AdminUsersFilterSelectControlName;
  inputId: string;
  labelKey: keyof AdminUsersFiltersTranslations;
  options: readonly string[];
  reloadOnChange?: boolean;
}

export interface AdminUsersFilterSelectFieldVm
  extends Pick<
    AdminUsersFilterSelectField,
    'controlName' | 'inputId' | 'reloadOnChange'
  > {
  label: string;
  options: ISelectOption<string>[];
}

export type AdminUserDialogForm = FormGroup<{
  appRole: FormControl<AppRole>;
  firstName: FormControl<string | null>;
  nickname: FormControl<string | null>;
  useNickname: FormControl<boolean>;
  phoneNumber: FormControl<string | null>;
  city: FormControl<string | null>;
  isTestUser: FormControl<boolean>;
}>;

export type AdminUserDialogTextControlName =
  | 'firstName'
  | 'nickname'
  | 'phoneNumber'
  | 'city';
export type AdminUserDialogToggleControlName = 'useNickname' | 'isTestUser';

export interface AdminUserDialogSelectField {
  controlName: 'appRole';
  inputId: string;
  labelKey: keyof AdminUsersDialogTranslations;
  options: readonly AppRole[];
}

export interface AdminUserDialogTextField {
  controlName: AdminUserDialogTextControlName;
  inputId: string;
  labelKey: keyof AdminUsersDialogTranslations;
  type: string;
  autocomplete: string;
  maxLength: number;
}

export interface AdminUserDialogToggleField {
  controlName: AdminUserDialogToggleControlName;
  inputId: string;
  labelKey: keyof AdminUsersDialogTranslations;
}

export const ADMIN_USERS_FILTER_SELECT_FIELDS: readonly AdminUsersFilterSelectField[] = [
  {
    controlName: 'role',
    inputId: 'admin-users-role',
    labelKey: 'roleLabel',
    options: ['all', ...APP_ROLES],
  },
  {
    controlName: 'profile',
    inputId: 'admin-users-profile',
    labelKey: 'profileLabel',
    options: ['all', 'with', 'without'],
  },
  {
    controlName: 'public',
    inputId: 'admin-users-public',
    labelKey: 'publicLabel',
    options: ['all', 'public', 'not_public'],
  },
  {
    controlName: 'sortBy',
    inputId: 'admin-users-sort-by',
    labelKey: 'sortLabel',
    options: ['createdAt', 'updatedAt'],
    reloadOnChange: true,
  },
  {
    controlName: 'sortOrder',
    inputId: 'admin-users-sort-order',
    labelKey: 'sortOrderLabel',
    options: ['desc', 'asc'],
    reloadOnChange: true,
  },
];

export const ADMIN_USER_DIALOG_SELECT_FIELDS: readonly AdminUserDialogSelectField[] = [
  {
    controlName: 'appRole',
    inputId: 'admin-user-role',
    labelKey: 'appRoleLabel',
    options: APP_ROLES,
  },
];

export const ADMIN_USER_DIALOG_TEXT_FIELDS: readonly AdminUserDialogTextField[] = [
  {
    controlName: 'firstName',
    inputId: 'admin-user-first-name',
    labelKey: 'firstNameLabel',
    type: 'text',
    autocomplete: 'given-name',
    maxLength: 100,
  },
  {
    controlName: 'nickname',
    inputId: 'admin-user-nickname',
    labelKey: 'nicknameLabel',
    type: 'text',
    autocomplete: 'nickname',
    maxLength: 100,
  },
  {
    controlName: 'phoneNumber',
    inputId: 'admin-user-phone',
    labelKey: 'phoneNumberLabel',
    type: 'tel',
    autocomplete: 'tel',
    maxLength: 50,
  },
  {
    controlName: 'city',
    inputId: 'admin-user-city',
    labelKey: 'cityLabel',
    type: 'text',
    autocomplete: 'address-level2',
    maxLength: 100,
  },
];

export const ADMIN_USER_DIALOG_TOGGLE_FIELDS: readonly AdminUserDialogToggleField[] = [
  {
    controlName: 'useNickname',
    inputId: 'admin-user-use-nickname',
    labelKey: 'useNicknameLabel',
  },
  {
    controlName: 'isTestUser',
    inputId: 'admin-user-test',
    labelKey: 'isTestUserLabel',
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
  roleLabels: AppRoleLabels,
): AdminUsersFilterSelectFieldVm[] {
  return ADMIN_USERS_FILTER_SELECT_FIELDS.map((field) => ({
    controlName: field.controlName,
    inputId: field.inputId,
    reloadOnChange: field.reloadOnChange,
    label: filters[field.labelKey],
    options: field.options.map((value) => ({
      value,
      label: getAdminUsersFilterOptionLabel(field.controlName, value, filters, roleLabels),
    })),
  }));
}

function getAdminUsersFilterOptionLabel(
  controlName: AdminUsersFilterSelectControlName,
  value: string,
  filters: AdminUsersFiltersTranslations,
  roleLabels: AppRoleLabels,
): string {
  switch (controlName) {
    case 'role':
      return value === 'all'
        ? filters.roleAll
        : getAppRoleLabel(value as AppRole, roleLabels);
    case 'profile':
      return {
        all: filters.profileAll,
        with: filters.profileWith,
        without: filters.profileWithout,
      }[value]!;
    case 'public':
      return {
        all: filters.publicAll,
        public: filters.publicOnly,
        not_public: filters.publicHidden,
      }[value]!;
    case 'sortBy':
      return {
        createdAt: filters.sortCreatedAt,
        updatedAt: filters.sortUpdatedAt,
      }[value]!;
    case 'sortOrder':
      return {
        desc: filters.sortDesc,
        asc: filters.sortAsc,
      }[value]!;
  }
}
