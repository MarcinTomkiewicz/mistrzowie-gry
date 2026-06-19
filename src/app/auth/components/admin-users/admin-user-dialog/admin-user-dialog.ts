import { CommonModule } from '@angular/common';
import { Component, effect, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import {
  IAdminUserRow,
  IAdminUserUpdateFormValue,
} from '../../../../core/types/admin-users';
import {
  createAppRoleOptions,
  getAppRoleLabel,
} from '../../../../core/utils/app-role-labels';
import { createAdminUsersI18n } from '../admin-users.i18n';
import {
  ADMIN_USER_DIALOG_SELECT_FIELDS,
  ADMIN_USER_DIALOG_TEXT_FIELDS,
  ADMIN_USER_DIALOG_TOGGLE_FIELDS,
  AdminUserDialogSelectField,
  AdminUserDialogTextField,
  AdminUserDialogToggleField,
  createAdminUserDialogForm,
  getAdminUserDialogValue,
} from '../admin-users.config';

@Component({
  selector: 'app-admin-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    IftaLabelModule,
    InputTextModule,
    SelectModule,
    ToggleSwitchModule,
  ],
  templateUrl: './admin-user-dialog.html',
})
export class AdminUserDialogComponent {
  readonly visible = input(false);
  readonly row = input<IAdminUserRow | null>(null);
  readonly saving = input(false);

  readonly visibleChange = output<boolean>();
  readonly save = output<IAdminUserUpdateFormValue>();

  protected readonly i18n = createAdminUsersI18n();
  protected readonly form = createAdminUserDialogForm();
  protected readonly selectFields = ADMIN_USER_DIALOG_SELECT_FIELDS;
  protected readonly textFields = ADMIN_USER_DIALOG_TEXT_FIELDS;
  protected readonly toggleFields = ADMIN_USER_DIALOG_TOGGLE_FIELDS;

  constructor() {
    effect(() => {
      const row = this.row();

      if (!row) {
        this.form.reset();
        return;
      }

      this.form.reset(getAdminUserDialogValue(row));
      this.form.markAsPristine();
      this.form.markAsUntouched();
    });
  }

  protected onVisibleChange(visible: boolean): void {
    this.visibleChange.emit(visible);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();

    this.save.emit({
      ...payload,
      appRole: this.isAdminRow() ? 'admin' : payload.appRole,
    });
  }

  protected isAdminRow(): boolean {
    return this.row()?.user.appRole === 'admin';
  }

  protected getCurrentRoleLabel(): string {
    const row = this.row();

    return getAppRoleLabel(
      row?.user.appRole ?? this.form.controls.appRole.getRawValue(),
      this.i18n.roleLabels(),
    );
  }

  protected getSelectOptions(field: AdminUserDialogSelectField) {
    return createAppRoleOptions(this.i18n.roleLabels(), field.options);
  }

  protected getSelectLabel(field: AdminUserDialogSelectField): string {
    return this.i18n.dialog()[field.labelKey];
  }

  protected getTextLabel(field: AdminUserDialogTextField): string {
    return this.i18n.dialog()[field.labelKey];
  }

  protected getToggleLabel(field: AdminUserDialogToggleField): string {
    return this.i18n.dialog()[field.labelKey];
  }

  protected hasTextControlError(field: AdminUserDialogTextField): boolean {
    const control = this.form.controls[field.controlName];
    return control.touched && !!control.errors?.['maxlength'];
  }

  protected maxLengthMessage(field: AdminUserDialogTextField): string {
    return this.i18n.commonForm().maxLength.replace(
      '{{max}}',
      String(field.maxLength),
    );
  }
}
