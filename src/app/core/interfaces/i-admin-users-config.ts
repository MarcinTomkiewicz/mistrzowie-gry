import { ISelectOption } from './i-select-option';
import {
  AdminUserDialogTextControlName,
  AdminUserDialogToggleControlName,
  AdminUsersFilterSelectControlName,
} from '../types/admin-users';
import { AppRole } from '../types/app-role';
import {
  AdminUsersDialogTranslations,
  AdminUsersFiltersTranslations,
} from '../types/i18n/admin-users';

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
