import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { finalize, map, startWith } from 'rxjs';

import { AdminUsers as CoreAdminUsers } from '../../../core/services/admin-users/admin-users';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import {
  IAdminGmProfileStatusPatch,
  IAdminUserRow,
  IAdminUsersFilterValue,
  IAdminUserUpdateFormValue,
} from '../../../core/types/admin-users';
import { getVisibleAdminUserRows } from '../../../core/utils/admin-users';
import { getAppRoleLabel } from '../../../core/utils/app-role-labels';
import { getUserDisplayName } from '../../../core/utils/user-display';
import { LoadingOverlay } from '../../../public/common/loading-overlay/loading-overlay';
import { AdminUserDialogComponent } from './admin-user-dialog/admin-user-dialog';
import { AdminUserProfileStatusToggleComponent } from './admin-user-profile-status-toggle/admin-user-profile-status-toggle';
import { createAdminUsersI18n } from './admin-users.i18n';
import {
  AdminUsersFilterSelectFieldVm,
  createAdminUsersFilterSelectFieldVms,
  createAdminUsersFilterForm,
} from './admin-users.config';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    InputTextModule,
    SelectModule,
    TableModule,
    ToggleSwitchModule,
    LoadingOverlay,
    AdminUserDialogComponent,
    AdminUserProfileStatusToggleComponent,
  ],
  templateUrl: './admin-users.html',
  providers: [provideTranslocoScope('adminUsers', 'common')],
})
export class AdminUsers {
  private readonly adminUsers = inject(CoreAdminUsers);
  private readonly toast = inject(UiToast);

  protected readonly i18n = createAdminUsersI18n();
  protected readonly getUserDisplayName = getUserDisplayName;
  protected readonly getAppRoleLabel = getAppRoleLabel;
  protected readonly rows = signal<readonly IAdminUserRow[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly hasLoadError = signal(false);
  protected readonly isDialogVisible = signal(false);
  protected readonly isSavingUser = signal(false);
  protected readonly savingProfileUserId = signal<string | null>(null);
  protected readonly selectedRow = signal<IAdminUserRow | null>(null);

  protected readonly filterForm = createAdminUsersFilterForm();
  protected readonly filterSelectFields = computed(() =>
    createAdminUsersFilterSelectFieldVms(
      this.i18n.filters(),
      this.i18n.roleLabels(),
    ),
  );
  private readonly filterValue = toSignal(
    this.filterForm.valueChanges.pipe(
      startWith(this.filterForm.getRawValue()),
      map(() => this.filterForm.getRawValue() as IAdminUsersFilterValue),
    ),
    { initialValue: this.filterForm.getRawValue() as IAdminUsersFilterValue },
  );

  protected readonly filteredRows = computed(() =>
    getVisibleAdminUserRows(this.rows(), this.filterValue()),
  );

  constructor() {
    this.loadUsers();
  }

  protected loadUsers(): void {
    const { sortBy, sortOrder } = this.filterForm.getRawValue();

    this.isLoading.set(true);
    this.hasLoadError.set(false);

    this.adminUsers
      .getUsers(sortBy, sortOrder)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (rows) => {
          this.rows.set(rows);
        },
        error: () => {
          this.rows.set([]);
          this.hasLoadError.set(true);
          this.toast.danger({
            summary: this.i18n.toast().loadFailedSummary,
            detail: this.i18n.toast().loadFailedDetail,
          });
        },
      });
  }

  protected onFilterSelectChange(field: AdminUsersFilterSelectFieldVm): void {
    if (field.reloadOnChange) {
      this.loadUsers();
    }
  }

  protected openUserDialog(row: IAdminUserRow): void {
    this.selectedRow.set(row);
    this.isDialogVisible.set(true);
  }

  protected onDialogVisibleChange(visible: boolean): void {
    this.isDialogVisible.set(visible);

    if (!visible && !this.isSavingUser()) {
      this.selectedRow.set(null);
    }
  }

  protected saveUser(payload: IAdminUserUpdateFormValue): void {
    const row = this.selectedRow();

    if (!row) {
      return;
    }

    this.isSavingUser.set(true);

    this.adminUsers
      .updateUser(row.user.id, payload)
      .pipe(finalize(() => this.isSavingUser.set(false)))
      .subscribe({
        next: () => {
          this.toast.success({
            summary: this.i18n.toast().saveSuccessSummary,
            detail: this.i18n.toast().saveSuccessDetail,
          });
          this.isDialogVisible.set(false);
          this.selectedRow.set(null);
          this.loadUsers();
        },
        error: () => {
          this.toast.danger({
            summary: this.i18n.toast().saveFailedSummary,
            detail: this.i18n.toast().saveFailedDetail,
          });
        },
      });
  }

  protected createGmProfile(row: IAdminUserRow): void {
    this.savingProfileUserId.set(row.user.id);

    this.adminUsers
      .createGmProfile(row.user.id)
      .pipe(finalize(() => this.savingProfileUserId.set(null)))
      .subscribe({
        next: () => {
          this.toast.success({
            summary: this.i18n.toast().profileCreateSuccessSummary,
            detail: this.i18n.toast().profileCreateSuccessDetail,
          });
          this.loadUsers();
        },
        error: () => {
          this.toast.danger({
            summary: this.i18n.toast().profileCreateFailedSummary,
            detail: this.i18n.toast().profileCreateFailedDetail,
          });
        },
      });
  }

  protected setGmProfilePublic(row: IAdminUserRow, isPublic: boolean): void {
    if (!row.gmProfile) {
      return;
    }

    this.updateGmProfileStatus(row, { isPublic });
  }

  protected setGmProfileArchived(row: IAdminUserRow, isArchived: boolean): void {
    if (!row.gmProfile) {
      return;
    }

    this.updateGmProfileStatus(row, { isArchived });
  }

  private updateGmProfileStatus(
    row: IAdminUserRow,
    patch: IAdminGmProfileStatusPatch,
  ): void {
    this.savingProfileUserId.set(row.user.id);

    this.adminUsers
      .updateGmProfileStatus(row.user.id, patch)
      .pipe(finalize(() => this.savingProfileUserId.set(null)))
      .subscribe({
        next: (gmProfile) => {
          this.toast.success({
            summary: this.i18n.toast().profileStatusSuccessSummary,
            detail: this.i18n.toast().profileStatusSuccessDetail,
          });
          this.updateRowGmProfile(row.user.id, gmProfile);
        },
        error: () => {
          this.updateRowGmProfile(
            row.user.id,
            row.gmProfile ? { ...row.gmProfile } : null,
          );
          this.toast.danger({
            summary: this.i18n.toast().profileStatusFailedSummary,
            detail: this.i18n.toast().profileStatusFailedDetail,
          });
        },
      });
  }

  private updateRowGmProfile(
    userId: string,
    gmProfile: IAdminUserRow['gmProfile'],
  ): void {
    this.rows.update((rows) =>
      rows.map((row) =>
        row.user.id === userId
          ? {
              ...row,
              gmProfile,
            }
          : row,
      ),
    );
  }
}
