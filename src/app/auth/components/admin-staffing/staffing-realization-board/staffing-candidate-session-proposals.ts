import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';

import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { SessionDetails } from '../../../../common/session-details/session-details';
import { StaffingRealizationEditorFacade } from '../../../../core/facades/staffing/staffing-realization-editor-facade';
import type { StaffingCandidate } from '../../../../core/interfaces/staffing-candidate';
import type { StaffingCandidateSessionOptions } from '../../../../core/interfaces/staffing-candidate-session-options';
import { compareByPosition } from '../../../../core/utils/compare-by-position';
import { formatDateLabel } from '../../../../core/utils/date';
import { formatTimeRangeLabel } from '../../../../core/utils/time-format';
import { createStaffingRealizationBoardI18n } from './staffing-realization-board.i18n';

@Component({
  selector: 'app-staffing-candidate-session-proposals',
  imports: [ButtonModule, LoadingOverlay, SessionDetails],
  templateUrl: './staffing-candidate-session-proposals.html',
})
export class StaffingCandidateSessionProposals {
  private readonly facade = inject(StaffingRealizationEditorFacade);
  private readonly reloadVersion = signal(0);
  private readonly options = signal<StaffingCandidateSessionOptions | null>(null);

  readonly candidate = input.required<StaffingCandidate>();
  readonly gmDisplayName = input<string | null>(null);

  protected readonly i18n = createStaffingRealizationBoardI18n();
  protected readonly isLoading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly previewedProposalId = signal<string | null>(null);
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly formatTimeRangeLabel = formatTimeRangeLabel;
  protected readonly slots = computed(() => {
    const options = this.options();
    if (!options) return [];
    return options.proposals.slots.map(slot => ({
      ...slot,
      mappings: [...slot.mappings].sort(compareByPosition).map(mapping => ({
        ...mapping,
        session: options.sessions[mapping.sourceKind].find(session => session.id === mapping.sessionId) ?? null,
      })),
    }));
  });

  constructor() {
    effect(onCleanup => {
      const candidate = this.candidate();
      this.reloadVersion();
      this.options.set(null);
      this.previewedProposalId.set(null);
      this.loadFailed.set(false);
      this.isLoading.set(true);
      const request = this.facade.loadCandidateSessionOptions(candidate).pipe(
        finalize(() => this.isLoading.set(false)),
      ).subscribe({
        next: options => this.options.set(options),
        error: () => this.loadFailed.set(true),
      });
      onCleanup(() => request.unsubscribe());
    });
  }

  protected retry(): void {
    this.reloadVersion.update(version => version + 1);
  }
}
