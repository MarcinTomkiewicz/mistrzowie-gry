import { Component, computed, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { finalize } from 'rxjs';

import { isCurrentStaffingCandidate } from '../../../../core/domain/staffing/candidates';
import { StaffingRealizationEditorFacade } from '../../../../core/facades/staffing/staffing-realization-editor-facade';
import type { AdminStaffingRealizationBoard } from '../../../../core/interfaces/admin-staffing-realization-board';
import type { ISelectOption } from '../../../../core/interfaces/i-select-option';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { formatDateLabel } from '../../../../core/utils/date';
import { setControlEnabled } from '../../../../core/utils/form-controls';
import { getUserDisplayName } from '../../../../core/utils/user-display';
import { createStaffingRealizationBoardI18n } from './staffing-realization-board.i18n';

@Component({
  selector: 'app-staffing-admin-proposal',
  imports: [ReactiveFormsModule, ButtonModule, DialogModule, MultiSelectModule, SelectModule],
  templateUrl: './staffing-admin-proposal.html',
})
export class StaffingAdminProposal {
  private readonly facade = inject(StaffingRealizationEditorFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(UiToast);

  readonly board = input.required<AdminStaffingRealizationBoard>();
  readonly closed = output<void>();
  readonly created = output<void>();

  protected readonly i18n = createStaffingRealizationBoardI18n();
  protected readonly isSaving = signal(false);
  protected readonly form = new FormGroup({
    gmUserId: new FormControl<string | null>(null, { validators: [Validators.required] }),
    dayIds: new FormControl<string[]>([], { nonNullable: true, validators: [Validators.required] }),
  });
  protected readonly selectedDays = computed(() =>
    this.board().realization.type === 'stationary' &&
    this.board().recruitmentPolicy?.stationaryScopePolicy === 'selected_days',
  );
  protected readonly gmOptions = computed<ISelectOption<string>[]>(() => {
    const board = this.board();
    const currentGms = new Set(board.candidates.filter(isCurrentStaffingCandidate).map(candidate => candidate.gmUserId));
    return board.availability.gms.filter(gm => !currentGms.has(gm.userId)).map(gm => ({
      value: gm.userId,
      label: getUserDisplayName(gm) || gm.userId,
    }));
  });
  protected readonly dayOptions = computed<ISelectOption<string>[]>(() =>
    this.board().schedule.days.map(day => ({ value: day.id, label: formatDateLabel(day.date, 'pl-PL', true) })),
  );

  constructor() {
    effect(() => setControlEnabled(this.form.controls.dayIds, this.selectedDays()));
  }

  protected close(): void {
    if (!this.isSaving()) this.closed.emit();
  }

  protected submit(): void {
    if (this.isSaving()) return;
    const gmUserId = this.form.controls.gmUserId.value;
    if (this.form.invalid || gmUserId === null) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.facade.createProposal(
      this.board().realization.id,
      gmUserId,
      this.selectedDays() ? this.form.controls.dayIds.value : null,
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isSaving.set(false)),
    ).subscribe({
      next: () => {
        this.toast.success({ summary: this.i18n.commonStatus().success,
          detail: this.i18n.copy().proposal.successSummary });
        this.created.emit();
      },
      error: () => this.toast.danger({
        summary: this.i18n.copy().proposal.failedSummary,
        detail: this.i18n.commonErrors().generic,
      }),
    });
  }
}
