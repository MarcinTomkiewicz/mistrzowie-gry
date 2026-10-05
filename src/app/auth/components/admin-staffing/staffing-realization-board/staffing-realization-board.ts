import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { distinctUntilChanged, finalize, map, Subscription } from 'rxjs';

import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { STATUS_BADGE_CLASS } from '../../../../core/configs/badge-class.config';
import { STAFFING_AVAILABILITY_BADGE_CLASS } from '../../../../core/configs/staffing-availability.config';
import { StaffingRealizationEditorFacade } from '../../../../core/facades/staffing/staffing-realization-editor-facade';
import type { AdminStaffingGmAvailability } from '../../../../core/interfaces/admin-staffing-availability';
import type { AdminStaffingRealizationBoard } from '../../../../core/interfaces/admin-staffing-realization-board';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { GM_STAFFING_SCOPE, STAFFING_SCOPE } from '../../../../core/translations/staffing.i18n';
import { formatDateLabel, formatTimestampLabel } from '../../../../core/utils/date';
import { getUserDisplayName } from '../../../../core/utils/user-display';
import { StaffingRealizationAvailability } from './staffing-realization-availability';
import { StaffingAdminProposal } from './staffing-admin-proposal';
import { createStaffingRealizationBoardI18n } from './staffing-realization-board.i18n';

@Component({
  selector: 'app-staffing-realization-board',
  imports: [ButtonModule, DialogModule, TableModule, LoadingOverlay, StaffingRealizationAvailability, StaffingAdminProposal],
  templateUrl: './staffing-realization-board.html',
  providers: [provideTranslocoScope('adminStaffing', STAFFING_SCOPE, GM_STAFFING_SCOPE, 'common')],
})
export class StaffingRealizationBoard {
  private readonly facade = inject(StaffingRealizationEditorFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(UiToast);
  private readonly confirm = inject(UiConfirm);
  private realizationId = '';
  private loadSubscription: Subscription | null = null;

  protected readonly i18n = createStaffingRealizationBoardI18n();
  protected readonly board = signal<AdminStaffingRealizationBoard | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly hasUnsavedChanges = this.facade.store.hasUnsavedChanges;
  protected readonly selectedGm = signal<AdminStaffingGmAvailability | null>(null);
  protected readonly selectedCandidateId = signal<string | null>(null);
  protected readonly showProposal = signal(false);
  protected readonly isDeciding = signal(false);
  protected readonly statusBadgeClass = STATUS_BADGE_CLASS;
  protected readonly getUserDisplayName = getUserDisplayName;
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly summary = computed(() => {
    const board = this.board();
    if (!board) return [];
    const copy = this.i18n.summary();
    return [
      { key: 'required', label: copy.required, value: board.summary.required, badgeClass: 'tag-badge--info' },
      { key: 'confirmed', label: copy.confirmed, value: board.summary.confirmed, badgeClass: 'tag-badge--success' },
      { key: 'vacancies', label: copy.vacancies, value: board.summary.vacancies, badgeClass: 'tag-badge--danger' },
    ];
  });
  protected readonly candidateRows = computed(() => {
    const board = this.board();
    if (!board) return [];
    const gms = new Map(board.availability.gms.map((gm) => [gm.userId, gm]));
    const copy = this.i18n.copy();
    const origins = this.i18n.candidateOrigins();
    const scopes = this.i18n.scopes();
    const decisions = this.i18n.candidateDecisions();
    const states = this.i18n.candidateStates();
    const endReasons = this.i18n.participationEndReasons();
    return board.candidates.map((candidate) => {
      const gm = gms.get(candidate.gmUserId);
      return {
        candidate,
        gm,
        originLabel: origins[candidate.origin],
        scopeLabel: scopes[candidate.scope.mode],
        stateLabel: states[candidate.state],
        stateBadgeClass: STATUS_BADGE_CLASS[candidate.state],
        endReasonLabel: candidate.participation.endReason ? endReasons[candidate.participation.endReason] : null,
        availabilityLabel: gm ? copy.availability.statuses[gm.status] : null,
        availabilityBadgeClass: gm ? STAFFING_AVAILABILITY_BADGE_CLASS[gm.status] : null,
        days: board.schedule.days.filter((day) => candidate.scope.dayIds.includes(day.id)),
        decisions: [
          { key: 'gmDecision', label: copy.fields.gmDecision, value: decisions[candidate.gmDecision],
            badgeClass: STATUS_BADGE_CLASS[candidate.gmDecision], decidedAt: candidate.gmDecidedAt },
          { key: 'adminDecision', label: copy.fields.adminDecision, value: decisions[candidate.adminDecision],
            badgeClass: STATUS_BADGE_CLASS[candidate.adminDecision], decidedAt: candidate.adminDecidedAt },
        ],
      };
    });
  });
  protected readonly candidateDetail = computed(() =>
    this.candidateRows().find((row) => row.candidate.id === this.selectedCandidateId()) ?? null,
  );
  protected readonly canDecideSelfApplication = computed(() => {
    const candidate = this.candidateDetail()?.candidate;
    return this.board()?.realization.status !== 'archived' &&
      candidate?.origin === 'self_application' && candidate.state === 'pending' &&
      candidate.submittedAt !== null;
  });

  constructor() {
    this.route.parent?.paramMap.pipe(
      map((params) => params.get('realizationId') ?? ''),
      distinctUntilChanged(),
      takeUntilDestroyed(),
    ).subscribe((realizationId) => {
      this.realizationId = realizationId;
      this.loadBoard();
    });
  }

  protected confirmSelfApplicationDecision(event: Event, decision: 'accepted' | 'rejected'): void {
    const candidate = this.candidateDetail()?.candidate;
    if (!candidate || !this.canDecideSelfApplication() || this.isDeciding()) return;
    const realizationId = this.realizationId;
    const copy = this.i18n.copy().selfApplicationDecision;
    const options = {
      message: decision === 'accepted' ? copy.acceptConfirm : copy.rejectConfirm,
      acceptLabel: decision === 'accepted' ? copy.accept : copy.reject,
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => {
        if (this.realizationId !== realizationId || this.candidateDetail()?.candidate.id !== candidate.id ||
          !this.canDecideSelfApplication() || this.isDeciding()) return;
        this.isDeciding.set(true);
        this.facade.decideSelfApplication(candidate.id, decision).pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.isDeciding.set(false)),
        ).subscribe({
          next: () => {
            if (this.realizationId !== realizationId) return;
            this.toast.success({ summary: decision === 'accepted' ? copy.acceptSuccess : copy.rejectSuccess });
            this.loadBoard();
          },
          error: () => {
            if (this.realizationId !== realizationId) return;
            this.toast.danger({ summary: copy.failedSummary, detail: this.i18n.commonErrors().generic });
          },
        });
      },
    };
    if (decision === 'rejected') this.confirm.dangerDecision(event, options);
    else this.confirm.decision(event, options);
  }

  protected loadBoard(): void {
    this.loadSubscription?.unsubscribe();
    this.board.set(null);
    this.selectedGm.set(null);
    this.selectedCandidateId.set(null);
    this.showProposal.set(false);
    this.isLoading.set(true);
    this.loadFailed.set(false);
    this.loadSubscription = this.facade.loadBoard(this.realizationId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: (board) => this.board.set(board),
      error: () => {
        this.loadFailed.set(true);
        this.toast.danger({
          summary: this.i18n.copy().loadFailed,
          detail: this.i18n.commonErrors().generic,
        });
      },
    });
  }
}
