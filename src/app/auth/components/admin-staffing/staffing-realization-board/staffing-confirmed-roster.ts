import { Component, computed, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { finalize } from 'rxjs';

import { STAFFING_AVAILABILITY_BADGE_CLASS } from '../../../../core/configs/staffing-availability.config';
import { StaffingRealizationEditorFacade } from '../../../../core/facades/staffing/staffing-realization-editor-facade';
import type { AdminStaffingGmAvailability } from '../../../../core/interfaces/admin-staffing-availability';
import type { AdminStaffingRealizationBoard } from '../../../../core/interfaces/admin-staffing-realization-board';
import type { StaffingCandidate } from '../../../../core/interfaces/staffing-candidate';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { formatDateLabel } from '../../../../core/utils/date';
import { getUserDisplayName } from '../../../../core/utils/user-display';
import { createStaffingRealizationBoardI18n } from './staffing-realization-board.i18n';

@Component({
  selector: 'app-staffing-confirmed-roster',
  imports: [ButtonModule, TableModule],
  templateUrl: './staffing-confirmed-roster.html',
})
export class StaffingConfirmedRoster {
  private readonly facade = inject(StaffingRealizationEditorFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);

  readonly board = input.required<AdminStaffingRealizationBoard>();
  readonly candidateSelected = output<string>();
  readonly availabilitySelected = output<AdminStaffingGmAvailability>();
  readonly removed = output<void>();

  protected readonly i18n = createStaffingRealizationBoardI18n();
  protected readonly removingCandidateId = signal<string | null>(null);
  protected readonly getUserDisplayName = getUserDisplayName;
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly canRemove = computed(() =>
    this.board().realization.status === 'open' || this.board().realization.status === 'closed',
  );
  protected readonly rows = computed(() => {
    const board = this.board();
    const gms = new Map(board.availability.gms.map(gm => [gm.userId, gm]));
    const availability = this.i18n.copy().availability.statuses;
    const scopes = this.i18n.scopes();
    return board.candidates.filter(candidate => candidate.state === 'confirmed' && candidate.participation.active === true)
      .map(candidate => {
        const gm = gms.get(candidate.gmUserId);
        return {
          candidate,
          gm,
          scopeLabel: scopes[candidate.scope.mode],
          days: board.schedule.days.filter(day => candidate.scope.dayIds.includes(day.id)),
          availabilityLabel: gm ? availability[gm.status] : null,
          availabilityBadgeClass: gm ? STAFFING_AVAILABILITY_BADGE_CLASS[gm.status] : null,
        };
      });
  });

  protected confirmRemoval(event: Event, candidate: StaffingCandidate): void {
    if (!this.canRemove() || this.removingCandidateId() !== null) return;
    const copy = this.i18n.copy().confirmedRoster;
    this.confirm.dangerDecision(event, {
      message: copy.removeConfirm,
      acceptLabel: copy.remove,
      acceptIcon: 'pi pi-demolish',
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => {
        if (!this.canRemove() || this.removingCandidateId() !== null) return;
        this.removingCandidateId.set(candidate.id);
        this.facade.removeConfirmedParticipation(candidate.id).pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.removingCandidateId.set(null)),
        ).subscribe({
          next: () => {
            this.toast.success({ summary: this.i18n.commonStatus().success, detail: copy.removeSuccess });
            this.removed.emit();
          },
          error: () => this.toast.danger({ summary: copy.removeFailed, detail: this.i18n.commonErrors().generic }),
        });
      },
    });
  }
}
