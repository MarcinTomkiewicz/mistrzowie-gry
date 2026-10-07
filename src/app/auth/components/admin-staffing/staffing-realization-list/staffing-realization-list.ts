import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { finalize, map, tap } from 'rxjs';

import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { STATUS_BADGE_CLASS } from '../../../../core/configs/badge-class.config';
import { AdminStaffingRealizationListItem } from '../../../../core/interfaces/admin-staffing-realization';
import { AdminStaffingRealizationRead } from '../../../../core/reads/staffing/admin-staffing-realization-read';
import { AdminStaffingRealization } from '../../../../core/services/staffing/admin-staffing-realization';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { STAFFING_SCOPE } from '../../../../core/translations/staffing.i18n';
import { StaffingRealizationListFilters } from '../../../../core/types/staffing-realization-list';
import { formatDateLabel } from '../../../../core/utils/date';
import {
  filterStaffingRealizations,
  updateStaffingRealizationList,
} from '../../../../core/utils/staffing-realization-list';
import { createStaffingRealizationListI18n } from './staffing-realization-list.i18n';

@Component({
  selector: 'app-staffing-realization-list',
  imports: [
    RouterLink, ReactiveFormsModule, ButtonModule, DatePickerModule, FloatLabelModule,
    InputTextModule, SelectModule, TableModule, ToggleSwitchModule, LoadingOverlay,
  ],
  templateUrl: './staffing-realization-list.html',
  providers: [provideTranslocoScope('adminStaffing', STAFFING_SCOPE, 'common')],
})
export class StaffingRealizationList {
  private readonly read = inject(AdminStaffingRealizationRead);
  private readonly write = inject(AdminStaffingRealization);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly i18n = createStaffingRealizationListI18n();
  protected readonly rows = signal<AdminStaffingRealizationListItem[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly hasLoadError = signal(false);
  protected readonly activeRealizationId = signal<string | null>(null);
  protected readonly isBusy = computed(
    () => this.isLoading() || this.activeRealizationId() !== null,
  );
  protected readonly first = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly rowsPerPageOptions = [10, 25, 50];
  protected readonly filterForm = new FormGroup({
    searchText: new FormControl('', { nonNullable: true }),
    date: new FormControl<Date | null>(null),
    type: new FormControl<StaffingRealizationListFilters['type']>(null),
    status: new FormControl<StaffingRealizationListFilters['status']>(null),
    showArchived: new FormControl(false, { nonNullable: true }),
  });
  private readonly filterValue = toSignal(
    this.filterForm.valueChanges.pipe(
      tap(() => {
        const { showArchived, status } = this.filterForm.controls;
        if (!showArchived.value && status.value === 'archived') {
          status.setValue(null, { emitEvent: false });
        }
      }),
      map(() => this.filterForm.getRawValue()),
      tap(() => this.first.set(0)),
    ),
    { initialValue: this.filterForm.getRawValue() },
  );
  protected readonly filteredRows = computed(() =>
    filterStaffingRealizations(this.rows(), this.filterValue()),
  );
  protected readonly typeOptions = computed(() =>
    Object.entries(this.i18n.realizationTypes()).map(([value, label]) => ({ value, label })),
  );
  protected readonly statusOptions = computed(() =>
    Object.entries(this.i18n.realizationStatuses())
      .filter(([value]) => this.filterValue().showArchived || value !== 'archived')
      .map(([value, label]) => ({ value, label })),
  );
  protected readonly rowVms = computed(() => {
    const values = this.i18n.commonValues();
    const summary = this.i18n.copy().summary;
    const statuses = this.i18n.realizationStatuses();
    const types = this.i18n.realizationTypes();

    return this.filteredRows().map((item) => ({
      item,
      cityLabel: item.city ?? values.notProvided,
      startDateLabel: item.startDate ? formatDateLabel(item.startDate) : values.notAvailable,
      endDateLabel: item.endDate && item.endDate !== item.startDate ? formatDateLabel(item.endDate) : null,
      statusLabel: statuses[item.status],
      statusBadgeClass: `tag-badge ${STATUS_BADGE_CLASS[item.status]}`,
      typeLabel: types[item.type],
      typeBadgeClass: item.type === 'travel' ? 'tag-badge tag-badge--info' : 'tag-badge tag-badge--golden',
      summary: [
        { key: 'required', label: summary.required, value: item.staffingSummary.required, badgeClass: 'tag-badge tag-badge--info' },
        { key: 'confirmed', label: summary.confirmed, value: item.staffingSummary.confirmed, badgeClass: 'tag-badge tag-badge--success' },
        { key: 'pending', label: summary.pending, value: item.staffingSummary.pending,
          badgeClass: 'tag-badge tag-badge--warn' },
        { key: 'vacancies', label: summary.vacancies, value: item.staffingSummary.vacancies,
          badgeClass: 'tag-badge tag-badge--danger' },
      ],
    }));
  });

  constructor() {
    this.loadRealizations();
  }

  protected loadRealizations(): void {
    this.isLoading.set(true);
    this.hasLoadError.set(false);
    this.read.getList().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: (rows) => this.rows.set(rows),
      error: () => {
        this.rows.set([]);
        this.hasLoadError.set(true);
        this.toast.danger({ summary: this.i18n.copy().page.loadErrorTitle,
          detail: this.i18n.commonErrors().generic });
      },
    });
  }

  protected confirmDelete(event: Event, realization: AdminStaffingRealizationListItem): void {
    this.confirm.dangerDecision(event, {
      message: this.i18n.copy().confirmation.delete.replace('{{name}}', realization.name),
      acceptLabel: this.i18n.commonActions().delete,
      acceptIcon: 'pi pi-demolish',
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => this.deleteRealization(realization.id),
    });
  }

  protected confirmArchive(event: Event, realization: AdminStaffingRealizationListItem): void {
    this.confirm.dangerDecision(event, {
      message: this.i18n.copy().confirmation.archive.replace('{{name}}', realization.name),
      acceptLabel: this.i18n.commonActions().archive,
      acceptIcon: 'pi pi-warehouse',
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => this.archiveRealization(realization.id),
    });
  }

  private deleteRealization(realizationId: string): void {
    this.activeRealizationId.set(realizationId);
    this.write.delete(realizationId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.activeRealizationId.set(null)),
    ).subscribe({
      next: (result) => {
        this.rows.update((rows) => rows.filter((row) => row.id !== result.realizationId));
        this.first.set(0);
        this.toast.success({ summary: this.i18n.commonStatus().success,
          detail: this.i18n.copy().toast.deleteSuccessSummary });
      },
      error: () => this.toast.danger({
        summary: this.i18n.copy().toast.deleteFailedSummary,
        detail: this.i18n.commonErrors().generic,
      }),
    });
  }

  private archiveRealization(realizationId: string): void {
    this.activeRealizationId.set(realizationId);
    this.write.archive(realizationId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.activeRealizationId.set(null)),
    ).subscribe({
      next: ({ realization }) => {
        this.rows.update((rows) => updateStaffingRealizationList(rows, realization));
        this.first.set(0);
        this.toast.success({ summary: this.i18n.commonStatus().success,
          detail: this.i18n.copy().toast.archiveSuccessSummary });
      },
      error: () => this.toast.danger({
        summary: this.i18n.copy().toast.archiveFailedSummary,
        detail: this.i18n.commonErrors().generic,
      }),
    });
  }
}
