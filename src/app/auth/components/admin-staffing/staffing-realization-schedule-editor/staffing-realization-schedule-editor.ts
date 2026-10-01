import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { finalize, forkJoin } from 'rxjs';

import { ItemEditorActions } from '../../../../common/item-editor-actions/item-editor-actions';
import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import {
  createStaffingRealizationDayForm,
  createStaffingRealizationDaysForm,
  mapStaffingRealizationDaysFormToInput,
  populateStaffingRealizationDaysForm,
} from '../../../../core/factories/staffing-realization-days-form.factory';
import { AdminStaffingRealizationCore } from '../../../../core/interfaces/admin-staffing-realization';
import { AdminStaffingRealizationRead } from '../../../../core/reads/staffing/admin-staffing-realization-read';
import { AdminStaffingRealization } from '../../../../core/services/staffing/admin-staffing-realization';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { STAFFING_SCOPE } from '../../../../core/translations/staffing.i18n';
import { createStaffingRealizationScheduleEditorI18n } from './staffing-realization-schedule-editor.i18n';

@Component({
  selector: 'app-staffing-realization-schedule-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    IftaLabelModule,
    InputNumberModule,
    MessageModule,
    ItemEditorActions,
    LoadingOverlay,
  ],
  templateUrl: './staffing-realization-schedule-editor.html',
  providers: [
    provideTranslocoScope('adminStaffing', STAFFING_SCOPE, 'common'),
  ],
})
export class StaffingRealizationScheduleEditor {
  private readonly route = inject(ActivatedRoute);
  private readonly realizationRead = inject(AdminStaffingRealizationRead);
  private readonly realizationWrite = inject(AdminStaffingRealization);
  private readonly toast = inject(UiToast);

  protected readonly realizationId =
    this.route.parent?.snapshot.paramMap.get('realizationId') ?? '';
  protected readonly i18n = createStaffingRealizationScheduleEditorI18n();
  protected readonly form = createStaffingRealizationDaysForm();
  protected readonly days = this.form.controls.days;
  protected readonly realization = signal<AdminStaffingRealizationCore | null>(
    null,
  );
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly loadFailed = signal(false);

  constructor() {
    this.loadSchedule();
  }

  protected loadSchedule(): void {
    this.isLoading.set(true);
    this.loadFailed.set(false);

    forkJoin({
      realization: this.realizationRead.getDetail(this.realizationId),
      days: this.realizationRead.getDays(this.realizationId),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ realization, days }) => {
          this.realization.set(realization);
          populateStaffingRealizationDaysForm(this.form, days);
        },
        error: () => {
          this.realization.set(null);
          this.loadFailed.set(true);
          this.toast.danger({
            summary: this.i18n.schedule().toast.loadFailedSummary,
            detail: this.i18n.commonErrors().generic,
          });
        },
      });
  }

  protected addDay(): void {
    if (this.isSaving()) {
      return;
    }

    this.days.push(createStaffingRealizationDayForm());
    this.days.markAsDirty();
  }

  protected removeDay(index: number): void {
    if (this.isSaving() || this.days.length === 1) {
      return;
    }

    this.days.removeAt(index);
    this.days.markAsDirty();
  }

  protected saveDays(): void {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();

      if (this.form.invalid) {
        this.toast.danger({
          summary: this.i18n.commonForm().invalidSummary,
          detail: this.i18n.commonForm().invalid,
        });
      }

      return;
    }

    this.isSaving.set(true);
    this.realizationWrite
      .saveDays(
        this.realizationId,
        mapStaffingRealizationDaysFormToInput(this.form),
      )
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (days) => {
          populateStaffingRealizationDaysForm(this.form, days);
          this.toast.success({
            summary: this.i18n.schedule().toast.saveSuccessSummary,
            detail: this.i18n.commonStatus().changesSaved,
          });
        },
        error: () => {
          this.toast.danger({
            summary: this.i18n.schedule().toast.saveFailedSummary,
            detail: this.i18n.commonErrors().changesNotSaved,
          });
        },
      });
  }

}
