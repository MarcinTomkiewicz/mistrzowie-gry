import { Location } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { finalize, Subscription } from 'rxjs';

import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import {
  STAFFING_REIMBURSEMENT_MODES,
  STAFFING_TRANSPORT_MODES,
  STAFFING_WORK_TIME_SCOPES,
} from '../../../../core/configs/staffing-travel-terms.config';
import { StaffingRealizationEditorFacade } from '../../../../core/facades/staffing/staffing-realization-editor-facade';
import {
  createStaffingRealizationTravelTermsForm,
  mapStaffingRealizationTravelTermsFormToPayload,
  mapStaffingTravelTermsToDraft,
  populateStaffingRealizationTravelTermsForm,
  syncStaffingRealizationTravelTermsForm,
} from '../../../../core/factories/staffing-realization-travel-terms-form.factory';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { createStaffingSaveLabel, STAFFING_SCOPE } from '../../../../core/translations/staffing.i18n';
import { StaffingRealizationTravelTermsForm } from '../../../../core/types/staffing-realization-form';
import {
  getStaffingTravelTermsFieldError,
  getStaffingTravelTermsFormError,
} from '../staffing-realization-form-errors';
import { createStaffingRealizationTravelTermsEditorI18n } from './staffing-realization-travel-terms-editor.i18n';
import { StaffingReadinessTarget } from '../staffing-readiness-target';

@Component({
  selector: 'app-staffing-realization-travel-terms-editor',
  imports: [
    ReactiveFormsModule, ButtonModule, CheckboxModule, FloatLabelModule,
    InputNumberModule, MessageModule, SelectModule, TextareaModule,
    LoadingOverlay,
    StaffingReadinessTarget,
  ],
  templateUrl: './staffing-realization-travel-terms-editor.html',
  providers: [provideTranslocoScope('adminStaffing', STAFFING_SCOPE, 'common')],
})
export class StaffingRealizationTravelTermsEditor {
  private readonly destroyRef = inject(DestroyRef);
  private readonly editor = inject(StaffingRealizationEditorFacade);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(UiToast);
  private loadSubscription: Subscription | null = null;
  private realizationId = this.route.parent?.snapshot.paramMap.get('realizationId') ?? '';

  protected readonly i18n = createStaffingRealizationTravelTermsEditorI18n();
  protected readonly form = createStaffingRealizationTravelTermsForm();
  protected readonly saveLabel = createStaffingSaveLabel(
    () => this.editor.store.realization()?.status,
    () => this.i18n.commonActions().save,
  );
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly loadFailed = signal(false);
  protected readonly isTravel = computed(() => this.editor.store.coreDraft()?.type === 'travel');
  protected readonly canSave = computed(() =>
    this.isTravel() && this.editor.store.realization()?.type === 'travel',
  );
  protected readonly transportOptions = computed(() =>
    STAFFING_TRANSPORT_MODES.map((value) => ({ value, label: this.i18n.transportModes()[value] })),
  );
  protected readonly reimbursementOptions = computed(() =>
    STAFFING_REIMBURSEMENT_MODES.map((value) => ({ value, label: this.i18n.reimbursementModes()[value] })),
  );
  protected readonly workTimeOptions = computed(() =>
    STAFFING_WORK_TIME_SCOPES.map((value) => ({ value, label: this.i18n.workTimeScopes()[value] })),
  );

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      syncStaffingRealizationTravelTermsForm(this.form);
      if (this.editor.store.travelTermsDraft() !== null) {
        this.editor.store.setTravelTermsDraft(this.form.getRawValue());
      }
    });
    this.route.parent?.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.realizationId = params.get('realizationId') ?? '';
      this.loadTravelTerms();
    });
  }

  protected loadTravelTerms(): void {
    this.loadSubscription?.unsubscribe();
    this.isLoading.set(true);
    this.loadFailed.set(false);
    this.loadSubscription = this.editor.loadTravelTerms(this.realizationId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: () => {
        const draft = this.editor.store.travelTermsDraft();
        if (draft) {
          populateStaffingRealizationTravelTermsForm(this.form, draft);
          if (this.editor.store.hasTravelTermsChanges()) this.form.markAsDirty();
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

  protected fieldError(field: keyof StaffingRealizationTravelTermsForm['controls']): string | null {
    if (!this.form.controls[field].touched) return null;
    return getStaffingTravelTermsFieldError(this.form, field, this.validationCopy(), this.i18n.commonForm());
  }

  protected cancel(): void {
    this.editor.store.reset();
    this.location.back();
  }

  protected save(): void {
    if (this.isLoading() || this.isSaving() || !this.canSave()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const detail = getStaffingTravelTermsFormError(this.form, this.validationCopy(), this.i18n.commonForm());
      if (detail) this.toast.danger({ summary: this.i18n.commonForm().invalidSummary, detail });
      return;
    }

    const realizationId = this.realizationId;
    this.isSaving.set(true);
    this.editor.saveTravelTerms(realizationId, mapStaffingRealizationTravelTermsFormToPayload(this.form))
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (terms) => {
          if (this.editor.store.realizationId() !== realizationId) return;
          populateStaffingRealizationTravelTermsForm(this.form, mapStaffingTravelTermsToDraft(terms));
          this.toast.success({
            summary: this.i18n.toast().saveSuccessSummary,
            detail: this.i18n.commonStatus().changesSaved,
          });
        },
        error: () => this.toast.danger({
          summary: this.i18n.toast().saveFailedSummary,
          detail: this.i18n.commonErrors().changesNotSaved,
        }),
      });
  }

  private validationCopy() {
    return { fields: this.i18n.fields(), validation: this.i18n.validation() };
  }
}
