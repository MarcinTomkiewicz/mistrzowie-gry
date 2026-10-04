import { Location } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { finalize, Subscription } from 'rxjs';

import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { STAFFING_SESSION_SELECTION_MODES, STAFFING_STATIONARY_SCOPE_POLICIES } from '../../../../core/configs/staffing-recruitment-policy.config';
import { StaffingRealizationEditorFacade } from '../../../../core/facades/staffing/staffing-realization-editor-facade';
import {
  createStaffingRecruitmentPolicyForm,
  mapStaffingRecruitmentPolicyFormToPayload,
  mapStaffingRecruitmentPolicyToDraft,
  populateStaffingRecruitmentPolicyForm,
  syncStaffingRecruitmentPolicyForm,
} from '../../../../core/factories/staffing-recruitment-policy-form.factory';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { StaffingRecruitmentPolicyDraft } from '../../../../core/types/staffing-recruitment-policy-form';
import { createStaffingRecruitmentPolicyEditorI18n } from './staffing-recruitment-policy-editor.i18n';
import { StaffingReadinessTarget } from '../staffing-readiness-target';
import { StaffingRealizationFinalization } from '../staffing-realization-finalization/staffing-realization-finalization';

@Component({
  selector: 'app-staffing-recruitment-policy-editor',
  imports: [ReactiveFormsModule, ButtonModule, CheckboxModule,
    MessageModule, SelectModule, LoadingOverlay, StaffingReadinessTarget, StaffingRealizationFinalization],
  templateUrl: './staffing-recruitment-policy-editor.html',
  providers: [provideTranslocoScope('adminStaffing', 'common')],
})
export class StaffingRecruitmentPolicyEditor {
  private readonly destroyRef = inject(DestroyRef);
  private readonly editor = inject(StaffingRealizationEditorFacade);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(UiToast);
  private loadSubscription: Subscription | null = null;
  private realizationId = '';

  protected readonly i18n = createStaffingRecruitmentPolicyEditorI18n();
  protected readonly form = createStaffingRecruitmentPolicyForm();
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly finalizing = signal(false);
  protected readonly loadFailed = signal(false);
  protected readonly type = computed(() => this.editor.store.coreDraft()?.type);
  protected readonly canSave = computed(() => this.type() !== undefined &&
    this.type() === this.editor.store.realization()?.type);
  protected readonly scopeOptions = computed(() => STAFFING_STATIONARY_SCOPE_POLICIES.map(
    (value) => ({ value, label: this.i18n.copy().stationaryScopes[value] }),
  ));
  protected readonly sessionOptions = computed(() => STAFFING_SESSION_SELECTION_MODES.map(
    (value) => ({ value, label: this.i18n.copy().sessionModes[value] }),
  ));

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      const type = this.type();
      if (type === undefined) return;
      syncStaffingRecruitmentPolicyForm(this.form, type);
      this.editor.store.setRecruitmentPolicyDraft(this.form.getRawValue());
    });
    this.route.parent?.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.realizationId = params.get('realizationId') ?? '';
      this.loadPolicy();
    });
  }

  protected loadPolicy(): void {
    this.loadSubscription?.unsubscribe();
    this.isLoading.set(true);
    this.loadFailed.set(false);
    this.loadSubscription = this.editor.loadRecruitmentPolicy(this.realizationId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: () => {
        const draft = this.editor.store.recruitmentPolicyDraft();
        const type = this.type();
        if (draft && type) {
          populateStaffingRecruitmentPolicyForm(this.form, draft, type);
          if (this.editor.store.hasRecruitmentPolicyChanges()) this.form.markAsDirty();
        }
      },
      error: () => {
        this.loadFailed.set(true);
        this.toast.danger({ summary: this.i18n.copy().toast.loadFailedSummary,
          detail: this.i18n.commonErrors().generic });
      },
    });
  }

  protected fieldError(field: keyof StaffingRecruitmentPolicyDraft): string | null {
    const control = this.form.controls[field];
    if (!control.touched || !control.invalid) return null;
    return this.i18n.commonForm().required;
  }

  protected cancel(): void {
    this.editor.store.reset();
    this.location.back();
  }

  protected save(): void {
    const type = this.type();
    if (!type || !this.canSave() || this.isLoading() || this.isSaving() || this.finalizing()) return;
    syncStaffingRecruitmentPolicyForm(this.form, type);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.danger({ summary: this.i18n.commonForm().invalidSummary,
        detail: this.i18n.commonForm().invalid });
      return;
    }
    const realizationId = this.realizationId;
    this.isSaving.set(true);
    this.editor.saveRecruitmentPolicy(realizationId, mapStaffingRecruitmentPolicyFormToPayload(this.form, type))
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (policy) => {
          if (this.editor.store.realizationId() !== realizationId) return;
          populateStaffingRecruitmentPolicyForm(this.form, mapStaffingRecruitmentPolicyToDraft(policy), type);
          this.toast.success({ summary: this.i18n.copy().toast.saveSuccessSummary,
            detail: this.i18n.commonStatus().changesSaved });
        },
        error: () => this.toast.danger({ summary: this.i18n.copy().toast.saveFailedSummary,
          detail: this.i18n.commonErrors().changesNotSaved }),
      });
  }
}
