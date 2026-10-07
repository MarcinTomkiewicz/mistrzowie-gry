import { Component, computed, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { finalize, map, startWith } from 'rxjs';

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
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import type { StaffingFinalPlanItemForm } from '../../../../core/types/staffing-final-plan-form';
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
  private readonly baseline = signal('');
  private readonly retryVersion = signal(0);

  readonly board = input.required<AdminStaffingRealizationBoard>();

  protected readonly i18n = createStaffingFinalPlanEditorI18n();
  protected readonly form = createStaffingFinalPlanForm();
  private readonly draft = toSignal(this.form.valueChanges.pipe(
    map(() => this.form.getRawValue()), startWith(this.form.getRawValue()),
  ), { requireSync: true });
  protected readonly plan = signal<AdminStaffingFinalPlan | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly loadFailed = signal(false);
  protected readonly materialChanges = signal<StaffingFinalPlanMaterialChange[] | null>(null);
  protected readonly showChangeDetails = signal(false);
  protected readonly canEdit = computed(() => !!this.plan()?.editable && !this.isLoading() && !this.isSaving());
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
      const realizationId = this.board().realization.id;
      this.retryVersion();
      this.plan.set(null);
      this.materialChanges.set(null);
      this.isLoading.set(true);
      this.loadFailed.set(false);
      const request = this.facade.loadFinalPlan(realizationId).pipe(
        finalize(() => this.isLoading.set(false)),
      ).subscribe({
        next: plan => this.applyPlan(plan),
        error: () => this.loadFailed.set(true),
      });
      onCleanup(() => request.unsubscribe());
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
    this.isSaving.set(true);
    this.facade.saveFinalPlan(plan.realizationId, items).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isSaving.set(false)),
    ).subscribe({
      next: result => {
        this.applyPlan(result.plan);
        this.materialChanges.set(result.materialChanges);
        this.showChangeDetails.set(false);
        this.toast.success({ summary: this.i18n.commonStatus().success,
          detail: this.i18n.finalPlan().saveSuccess });
      },
      error: () => this.toast.danger({
        summary: this.i18n.finalPlan().saveFailed,
        detail: this.i18n.commonErrors().changesNotSaved,
      }),
    });
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
    setControlEnabled(this.form, plan.editable && !this.isLoading() && !this.isSaving());
  }
}
