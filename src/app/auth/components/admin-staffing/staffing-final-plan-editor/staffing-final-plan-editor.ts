import { Component, computed, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { finalize, map, startWith, Subscription } from 'rxjs';

import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { SessionDetails } from '../../../../common/session-details/session-details';
import { StaffingRealizationEditorFacade } from '../../../../core/facades/staffing/staffing-realization-editor-facade';
import {
  createStaffingFinalPlanForm,
  createStaffingFinalPlanItemForm,
  mapStaffingFinalPlanFormToInput,
  populateStaffingFinalPlanForm,
} from '../../../../core/factories/staffing-final-plan-form.factory';
import type { AdminStaffingFinalPlan, StaffingFinalPlanMaterialChange } from '../../../../core/interfaces/admin-staffing-final-plan';
import type { AdminStaffingRealizationBoard } from '../../../../core/interfaces/admin-staffing-realization-board';
import type { AdminStaffingRealizationCore } from '../../../../core/interfaces/admin-staffing-realization';
import type { EventProgramReconciliationResult } from '../../../../core/interfaces/i-event-admin';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import type { StaffingFinalPlanItemForm } from '../../../../core/types/staffing-final-plan-form';
import { RpcError } from '../../../../core/types/rpc-error';
import { formatDateLabel } from '../../../../core/utils/date';
import { setControlEnabled } from '../../../../core/utils/form-controls';
import { formatTimeRangeLabel } from '../../../../core/utils/time-format';
import { getUserDisplayName } from '../../../../core/utils/user-display';
import { StaffingFinalPlanAssignmentEditor } from './staffing-final-plan-assignment-editor';
import { createStaffingFinalPlanEditorI18n } from './staffing-final-plan-editor.i18n';

@Component({
  selector: 'app-staffing-final-plan-editor',
  imports: [ReactiveFormsModule, ButtonModule, LoadingOverlay, SessionDetails, StaffingFinalPlanAssignmentEditor],
  templateUrl: './staffing-final-plan-editor.html',
  providers: [provideTranslocoScope('sessions')],
})
export class StaffingFinalPlanEditor {
  private readonly facade = inject(StaffingRealizationEditorFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(UiToast);
  private readonly route = inject(ActivatedRoute);
  private readonly routeRealizationId = toSignal(this.route.parent!.paramMap.pipe(
    map(params => params.get('realizationId')),
  ), { requireSync: true });
  private readonly baseline = signal('');
  private readonly retryVersion = signal(0);
  private actionRequest: Subscription | null = null;
  private pendingReconciliation: AdminStaffingRealizationCore | null = null;

  readonly board = input.required<AdminStaffingRealizationBoard>();

  protected readonly i18n = createStaffingFinalPlanEditorI18n();
  protected readonly form = createStaffingFinalPlanForm();
  private readonly draft = toSignal(this.form.valueChanges.pipe(
    map(() => this.form.getRawValue()), startWith(this.form.getRawValue()),
  ), { requireSync: true });
  protected readonly plan = signal<AdminStaffingFinalPlan | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly isReconciling = signal(false);
  protected readonly reconciliationResult = signal<EventProgramReconciliationResult | null>(null);
  protected readonly reconciliationFailed = signal(false);
  protected readonly saveErrorDetail = signal<string | null>(null);
  protected readonly loadFailed = signal(false);
  protected readonly materialChanges = signal<StaffingFinalPlanMaterialChange[] | null>(null);
  protected readonly showChangeDetails = signal(false);
  protected readonly canEdit = computed(() => {
    const plan = this.plan();
    return !!plan?.editable && plan.realizationId === this.board().realization.id &&
      this.isCurrentRealization(this.board().realization) &&
      !this.isLoading() && !this.isSaving() && !this.isReconciling();
  });
  protected readonly hasChanges = computed(() => JSON.stringify(this.draft()) !== this.baseline());
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly formatTimeRangeLabel = formatTimeRangeLabel;
  protected readonly gmNames = computed(() => new Map(this.board().availability.gms.map(gm =>
    [gm.userId, getUserDisplayName(gm) || gm.userId],
  )));
  protected readonly days = computed(() => {
    this.draft();
    return (this.plan()?.days ?? []).map(day => ({
      ...day,
      slots: day.slots.map(slot => {
        const forms = this.form.controls.items.controls.filter(form => form.controls.slotId.value === slot.slotId);
        return {
          ...slot,
          hasConflicts: slot.assignments.some(assignment => assignment.conflict !== null),
          assignedCount: new Set(forms
            .filter(form => !!form.controls.candidateId.value && !!form.controls.sessionId.value)
            .map(form => form.controls.candidateId.value),
          ).size,
          items: forms.map(form => ({ form, saved: slot.assignments.find(assignment => assignment.id === form.controls.id.value) ?? null })),
        };
      }),
    }));
  });

  constructor() {
    effect(() => setControlEnabled(this.form, this.canEdit()));
    effect(onCleanup => {
      const realization = this.board().realization;
      const routeRealizationId = this.routeRealizationId();
      this.retryVersion();
      this.pendingReconciliation = null;
      this.plan.set(null);
      this.materialChanges.set(null);
      this.showChangeDetails.set(false);
      this.isSaving.set(false);
      this.isReconciling.set(false);
      this.reconciliationResult.set(null);
      this.reconciliationFailed.set(false);
      this.saveErrorDetail.set(null);
      this.isLoading.set(true);
      this.loadFailed.set(false);
      if (realization.id !== routeRealizationId) return;
      const request = this.facade.loadFinalPlan(realization.id).pipe(
        finalize(() => this.isLoading.set(false)),
      ).subscribe({
        next: plan => { if (this.isCurrentRealization(realization)) this.applyPlan(plan); },
        error: () => { if (this.isCurrentRealization(realization)) this.loadFailed.set(true); },
      });
      onCleanup(() => {
        request.unsubscribe();
        this.actionRequest?.unsubscribe();
        this.actionRequest = null;
      });
    });
  }

  protected retry(): void {
    this.retryVersion.update(version => version + 1);
  }

  protected addAssignment(slotId: string): void {
    if (!this.canEdit()) return;
    const positions = this.form.controls.items.getRawValue().filter(item => item.slotId === slotId).map(item => item.position);
    this.form.controls.items.push(createStaffingFinalPlanItemForm(slotId, Math.max(0, ...positions) + 1));
  }

  protected removeAssignment(item: StaffingFinalPlanItemForm): void {
    if (this.canEdit()) this.form.controls.items.removeAt(this.form.controls.items.controls.indexOf(item));
  }

  protected cancel(): void {
    const plan = this.plan();
    if (plan && this.canEdit()) this.applyPlan(plan);
  }

  protected save(): void {
    const plan = this.plan();
    if (!plan || !this.canEdit() || !this.hasChanges()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.danger({ summary: this.i18n.commonForm().invalidSummary, detail: this.i18n.finalPlan().invalid });
      return;
    }
    const items = mapStaffingFinalPlanFormToInput(this.form);
    const realization = this.board().realization;
    this.saveErrorDetail.set(null);
    this.isSaving.set(true);
    this.actionRequest = this.facade.saveFinalPlan(plan.realizationId, items).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isSaving.set(false)),
    ).subscribe({
      next: result => {
        if (!this.isCurrentRealization(realization)) return;
        this.applyPlan(result.plan);
        this.materialChanges.set(result.materialChanges);
        this.showChangeDetails.set(false);
        this.toast.success({ summary: this.i18n.commonStatus().success,
          detail: this.i18n.finalPlan().saveSuccess });
        this.isSaving.set(false);
        this.synchronize(realization);
      },
      error: (error: unknown) => {
        if (!this.isCurrentRealization(realization)) return;
        const detail = error instanceof RpcError && error.code === '23514'
          ? `${this.i18n.finalPlan().saveRejected} ${error.message}`
          : this.i18n.commonErrors().changesNotSaved;
        this.saveErrorDetail.set(detail);
        this.toast.danger({ summary: this.i18n.finalPlan().saveFailed, detail });
      },
    });
  }

  protected retrySynchronization(): void {
    const realization = this.pendingReconciliation;
    if (!realization || !this.reconciliationFailed() || this.isLoading() ||
      this.isSaving() || this.isReconciling() || !this.isCurrentRealization(realization)) return;
    this.synchronize(realization);
  }

  private synchronize(realization: AdminStaffingRealizationCore): void {
    if (!this.isCurrentRealization(realization)) return;
    this.pendingReconciliation = realization;
    this.reconciliationResult.set(null);
    this.reconciliationFailed.set(false);
    this.isReconciling.set(true);
    this.actionRequest = this.facade.reconcileEventProgram(realization).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isReconciling.set(false)),
    ).subscribe({
      next: result => {
        if (!this.isCurrentRealization(realization)) return;
        this.pendingReconciliation = null;
        this.reconciliationResult.set(result);
        if (result) this.toast.success({
          summary: this.i18n.commonStatus().success,
          detail: result.createdCount || result.promotedCount
            ? this.i18n.finalPlan().synchronization.updated
            : this.i18n.finalPlan().synchronization.current,
        });
      },
      error: () => {
        if (!this.isCurrentRealization(realization)) return;
        this.reconciliationFailed.set(true);
        this.toast.danger({
          summary: this.i18n.finalPlan().saveSuccess,
          detail: this.i18n.finalPlan().synchronization.failed,
        });
      },
    });
  }

  private isCurrentRealization(realization: AdminStaffingRealizationCore): boolean {
    const current = this.board().realization;
    return this.routeRealizationId() === realization.id && current.id === realization.id &&
      current.eventId === realization.eventId && this.facade.store.realizationId() === realization.id;
  }

  protected slotLabel(slotId: string): string {
    for (const day of this.plan()?.days ?? []) {
      const slot = day.slots.find(slot => slot.slotId === slotId);
      if (slot) return `${formatDateLabel(day.date)} - ${slot.label} - ${formatTimeRangeLabel(slot.startTime, slot.endTime)}`;
    }
    return slotId;
  }

  private applyPlan(plan: AdminStaffingFinalPlan): void {
    this.plan.set(plan);
    populateStaffingFinalPlanForm(this.form, plan);
    this.baseline.set(JSON.stringify(this.form.getRawValue()));
    setControlEnabled(this.form, this.canEdit());
  }
}
