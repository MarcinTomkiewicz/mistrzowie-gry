import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { finalize } from 'rxjs';

import { StaffingEventSyncSourceChanged } from '../../../core/facades/staffing/staffing-event-synchronization-state';
import { StaffingRealizationEditorFacade } from '../../../core/facades/staffing/staffing-realization-editor-facade';
import { UiConfirm } from '../../../core/services/ui-confirm/ui-confirm';
import { createCommonActionsI18n } from '../../../core/translations/common.i18n';
import { createScopedObjectI18n } from '../../../core/translations/scoped.i18n';
import type { StaffingEventSynchronizationCopy } from '../../../core/types/i18n/staffing-event-synchronization';
import type { StaffingFinalPlanCopy } from '../../../core/types/i18n/staffing-final-plan';
import { RpcError } from '../../../core/types/rpc-error';

const errorKeys: Readonly<Record<string, keyof StaffingEventSynchronizationCopy['errors']>> = {
  EFS087_EVENT_ID_REQUIRED: 'invalid', EFS087_NOT_CONVERTED_STAFFING_EVENT: 'notConverted',
  EFS087_BROKEN_CONVERSION_IDENTITY: 'identity', EFS087_PRIVATE_UNRELEASED_EVENT_REQUIRED: 'privateRequired',
  EFS087_PROTECTED_EVENT_HISTORY: 'history', EFS087_PROGRAM_PROVENANCE_CONFLICT: 'provenance',
  EFS087_INVALID_SCHEDULE_DAYS: 'schedule', EFS087_DAY_CAPACITY_INVALID: 'capacity',
  EFS087_TIMED_SLOTS_REQUIRED: 'slots', EFS087_SOURCE_SCHEDULE_IDENTITY_CONFLICT: 'sourceIdentity',
  EFS087_INVALID_FINAL_PLAN_ASSIGNMENT: 'assignment', EFS087_PAST_OCCURRENCE_REMOVAL_FORBIDDEN: 'pastRemoval',
  EFS087_OCCURRENCE_SYNC_MISMATCH: 'occurrences',
};

@Component({
  selector: 'app-staffing-event-synchronization-status',
  imports: [RouterLink, ButtonModule, MessageModule],
  templateUrl: './staffing-event-synchronization-status.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class StaffingEventSynchronizationStatus {
  readonly realizationId = input.required<string>();
  readonly disabled = input(false);
  readonly dirty = input(false);
  private readonly confirm = inject(UiConfirm);
  private readonly destroyRef = inject(DestroyRef);
  private readonly commonActions = createCommonActionsI18n();
  protected readonly isConfirming = signal(false);
  protected readonly synchronization = inject(StaffingRealizationEditorFacade).eventSynchronization;
  protected readonly state = computed(() => this.synchronization.state(this.realizationId()));
  protected readonly copy = createScopedObjectI18n<StaffingEventSynchronizationCopy>('adminStaffing', 'eventSynchronization');
  protected readonly releasedCopy = createScopedObjectI18n<StaffingFinalPlanCopy['synchronization']>('adminStaffing', 'finalPlan.synchronization');
  protected readonly errorMessage = computed(() => {
    const error = this.state()?.error;
    if (error instanceof StaffingEventSyncSourceChanged) return this.copy().errors.sourceChanged;
    if (!(error instanceof RpcError)) return this.copy().errors.unknown;
    const key = errorKeys[error.message] ?? (error.code === '42501' ? 'forbidden' : null);
    return key ? this.copy().errors[key] : `${this.copy().errors.unknown} (${error.code}: ${error.message})`;
  });
  protected readonly privateCounts = computed(() => {
    const snapshot = this.state()?.snapshot;
    if (!snapshot) return null;
    return {
      occurrences: snapshot.edition.occurrences.length,
      slots: snapshot.timeline.occurrences.reduce((count, day) => count + new Set(day.rows.map(row => row.slotId)).size, 0),
      programItems: snapshot.timeline.occurrences.reduce((count, day) => count + day.rows.filter(row => row.programItemId !== null).length, 0),
    };
  });

  protected retry(): void {
    if (this.disabled() || this.dirty() || this.isConfirming()) return;
    const phase = this.state()?.phase;
    if (phase === 'uncertain' || phase === 'readback') this.synchronization.retryReadback(this.realizationId());
    else if (phase === 'failed') this.synchronization.retry(this.realizationId());
  }

  protected abandon(): void {
    const realizationId = this.realizationId();
    const state = this.state();
    if (!state || this.disabled() || this.isConfirming() || !this.synchronization.canAbandon(realizationId)) return;
    this.isConfirming.set(true);
    this.confirm.modalDecision({
      header: this.copy().title, message: this.copy().abandonConfirm,
      acceptLabel: this.copy().abandon, rejectLabel: this.commonActions().cancel,
    }).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.isConfirming.set(false))).subscribe(accepted => {
      if (accepted && !this.disabled() && this.realizationId() === realizationId) this.synchronization.abandon(realizationId, state);
    });
  }
}
