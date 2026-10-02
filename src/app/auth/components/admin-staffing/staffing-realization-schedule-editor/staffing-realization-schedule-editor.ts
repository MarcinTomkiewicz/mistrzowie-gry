import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { finalize, Subscription } from 'rxjs';

import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { getStaffingScheduleSummary } from '../../../../core/domain/staffing/schedule';
import {
  addStaffingRealizationDay,
  createStaffingRealizationDaysForm,
  mapStaffingRealizationScheduleToDraft,
  mapStaffingRealizationDaysFormToInput,
  populateStaffingRealizationDaysForm,
} from '../../../../core/factories/staffing-realization-days-form.factory';
import { StaffingRealizationEditorFacade } from '../../../../core/facades/staffing/staffing-realization-editor-facade';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { STAFFING_SCOPE } from '../../../../core/translations/staffing.i18n';
import { getStaffingScheduleFormError } from '../staffing-realization-form-errors';
import { StaffingRealizationDayEditor } from './staffing-realization-day-editor';
import { createStaffingRealizationScheduleEditorI18n } from './staffing-realization-schedule-editor.i18n';

@Component({
  selector: 'app-staffing-realization-schedule-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    MessageModule,
    LoadingOverlay,
    StaffingRealizationDayEditor,
  ],
  templateUrl: './staffing-realization-schedule-editor.html',
  providers: [
    provideTranslocoScope('adminStaffing', STAFFING_SCOPE, 'common'),
  ],
})
export class StaffingRealizationScheduleEditor {
  private readonly destroyRef = inject(DestroyRef);
  private readonly editor = inject(StaffingRealizationEditorFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(UiToast);

  private loadSubscription: Subscription | null = null;

  protected realizationId =
    this.route.parent?.snapshot.paramMap.get('realizationId') ?? '';
  protected readonly i18n = createStaffingRealizationScheduleEditorI18n();
  protected readonly form = createStaffingRealizationDaysForm();
  protected readonly days = this.form.controls.days;
  protected readonly summary = computed(() =>
    getStaffingScheduleSummary(this.editor.store.scheduleDraft() ?? []),
  );
  protected readonly realization = this.editor.store.coreDraft;
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly loadFailed = signal(false);

  constructor() {
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (this.editor.store.scheduleDraft() !== null) {
          this.editor.store.setScheduleDraft(this.days.getRawValue());
        }
      });
    this.route.parent?.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.realizationId = params.get('realizationId') ?? '';
      this.loadSchedule();
    });
  }

  protected loadSchedule(): void {
    this.loadSubscription?.unsubscribe();
    this.isLoading.set(true);
    this.loadFailed.set(false);

    this.loadSubscription = this.editor.load(this.realizationId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: () => {
          const draft = this.editor.store.scheduleDraft();
          if (draft) {
            populateStaffingRealizationDaysForm(this.form, draft);
            if (this.editor.store.hasScheduleChanges()) {
              this.form.markAsDirty();
            }
          }
        },
        error: () => {
          this.loadFailed.set(true);
          this.toast.danger({
            summary: this.i18n.toast().loadFailedSummary,
            detail: this.i18n.commonErrors().generic,
          });
        },
      });
  }

  protected addDay(): void {
    if (this.isSaving()) {
      return;
    }

    addStaffingRealizationDay(this.days);
  }

  protected saveSchedule(): void {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();

      if (this.form.invalid) {
        const detail = getStaffingScheduleFormError(
          this.form,
          this.i18n.validation(),
          this.i18n.staffingLabels().requiredGmCount,
          this.i18n.commonForm(),
        );
        if (detail) {
          this.toast.danger({
            summary: this.i18n.commonForm().invalidSummary,
            detail,
          });
        }
      }

      return;
    }

    this.isSaving.set(true);
    const realizationId = this.realizationId;
    this.editor
      .saveSchedule(
        realizationId,
        mapStaffingRealizationDaysFormToInput(this.form),
      )
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (schedule) => {
          if (this.realizationId !== realizationId) {
            return;
          }
          populateStaffingRealizationDaysForm(
            this.form,
            mapStaffingRealizationScheduleToDraft(schedule),
          );
          this.toast.success({
            summary: this.i18n.toast().saveSuccessSummary,
            detail: this.i18n.commonStatus().changesSaved,
          });
        },
        error: () => {
          this.toast.danger({
            summary: this.i18n.toast().saveFailedSummary,
            detail: this.i18n.commonErrors().changesNotSaved,
          });
        },
      });
  }
}
