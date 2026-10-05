import { Component, DestroyRef, effect, inject, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { catchError, EMPTY, startWith, Subject, switchMap } from 'rxjs';

import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { GmStaffingRealizationFacade } from '../../../core/facades/staffing/gm-staffing-realization-facade';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { formatDateLabel } from '../../../core/utils/date';
import { formatTimeRangeLabel } from '../../../core/utils/time-format';
import { StaffingSessionSelector } from '../../common/staffing-session-selector/staffing-session-selector';
import { createGmStaffingRealizationDetailI18n } from './gm-staffing-realization-detail.i18n';

@Component({
  selector: 'app-gm-staffing-session-proposals',
  imports: [ButtonModule, LoadingOverlay, StaffingSessionSelector],
  templateUrl: './gm-staffing-session-proposals.html',
})
export class GmStaffingSessionProposals {
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(UiToast);
  private readonly reload = new Subject<void>();

  protected readonly facade = inject(GmStaffingRealizationFacade);
  protected readonly i18n = createGmStaffingRealizationDetailI18n();
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly formatTimeRangeLabel = formatTimeRangeLabel;

  constructor() {
    effect(onCleanup => {
      // Participation can end while the visible candidate ID stays the same.
      this.facade.detail();
      const candidateId = this.facade.sessionProposalCandidateId();
      const proposals = this.facade.sessionProposals();
      if (!candidateId || proposals?.candidateId === candidateId) return;
      const request = untracked(() => this.reload.pipe(
        startWith(undefined),
        switchMap(() => this.facade.loadSessionProposals(candidateId).pipe(catchError(() => EMPTY))),
      ).subscribe());
      onCleanup(() => request.unsubscribe());
    });
  }

  protected retry(): void {
    if (!this.facade.sessionProposalsLoading()) this.reload.next();
  }

  protected save(): void {
    const candidateId = this.facade.sessionProposalCandidateId();
    this.facade.saveSessionProposals().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (this.facade.sessionProposalCandidateId() !== candidateId) return;
        this.toast.success({ summary: this.i18n.copy().sessionProposals.saveSuccess });
      },
      error: () => {
        if (this.facade.sessionProposalCandidateId() !== candidateId) return;
        this.toast.danger({
          summary: this.i18n.copy().sessionProposals.saveFailed,
          detail: this.i18n.commonErrors().changesNotSaved,
        });
      },
    });
  }
}
