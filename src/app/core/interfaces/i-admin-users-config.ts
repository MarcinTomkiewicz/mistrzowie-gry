import { ISelectOption } from './i-select-option';
import {
  AdminUserDialogTextControlName,
  AdminUserDialogToggleControlName,
  AdminUsersFilterSelectControlName,
} from '../types/admin-users';
import { AppRole } from '../types/app-role';
export interface AdminUsersFilterSelectField {
  controlName: AdminUsersFilterSelectControlName;
  inputId: string;
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
  options: readonly AppRole[];
}

export interface AdminUserDialogTextField {
  controlName: AdminUserDialogTextControlName;
  inputId: string;
  type: string;
  autocomplete: string;
  maxLength: number;
}

export interface AdminUserDialogToggleField {
  controlName: AdminUserDialogToggleControlName;
  inputId: string;
}
