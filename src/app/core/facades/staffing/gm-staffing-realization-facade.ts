import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, defer, EMPTY, finalize, interval, map, Observable, of, tap, throwError } from 'rxjs';

import { getStaffingParticipationActions } from '../../domain/staffing/participation';
import type { MyStaffingCandidate, MyStaffingRealizationDetail } from '../../interfaces/my-staffing-realization';
import type { ISelectOption } from '../../interfaces/i-select-option';
import type {
  CandidateSlotSessionMappingInput,
  StaffingCandidateSessionProposals,
} from '../../interfaces/staffing-candidate-session-proposals';
import type { StaffingSessionReference } from '../../interfaces/staffing-session-reference';
import type { StaffingCandidateThread } from '../../interfaces/staffing-candidate-thread';
import { MyStaffingRealizationRead } from '../../reads/staffing/my-staffing-realization-read';
import { Platform } from '../../services/platform/platform';
import { MyStaffingRealization } from '../../services/staffing/my-staffing-realization';
import type { StaffingSessionProposalSlotDraft } from '../../types/staffing-session-proposal-draft';
import { compareByPosition } from '../../utils/compare-by-position';
import { getUserDisplayName } from '../../utils/user-display';

@Injectable()
export class GmStaffingRealizationFacade {
  private readonly destroyRef = inject(DestroyRef);
  private readonly read = inject(MyStaffingRealizationRead);
  private readonly write = inject(MyStaffingRealization);
  private readonly detailSource = signal<MyStaffingRealizationDetail | null>(null);
  private readonly now = signal(Date.now());
  private readonly sessionProposalsSource = signal<StaffingCandidateSessionProposals | null>(null);
  private readonly sessionProposalDraftSource = signal<StaffingSessionProposalSlotDraft[]>([]);
  private nextSessionMappingKey = 0;

  readonly detail = this.detailSource.asReadonly();
  readonly isLoading = signal(false);
  readonly loadError = signal<unknown | null>(null);
  readonly isMutating = signal(false);
  readonly actions = computed(() => {
    const detail = this.detail();
    return detail ? getStaffingParticipationActions(detail, this.now()) : null;
  });
  readonly sessionProposalCandidateId = computed(() => {
    const detail = this.detail();
    const candidate = detail?.candidate;
    return candidate?.state === 'confirmed' &&
      detail?.recruitmentPolicy?.sessionSelectionMode === 'gm_selects' ? candidate.id : null;
  });
  readonly sessionProposals = this.sessionProposalsSource.asReadonly();
  readonly sessionProposalsLoading = signal(false);
  readonly sessionProposalsLoadError = signal<unknown | null>(null);
  readonly sessionProposalSlots = computed(() => this.sessionProposalDraftSource().map(slot => ({
    ...slot,
    selectedCount: slot.mappings.filter(mapping => mapping.selection !== null).length,
  })));
  private readonly sessionProposalPayload = computed<CandidateSlotSessionMappingInput[]>(() =>
    this.sessionProposalDraftSource().flatMap(slot => slot.mappings.flatMap(mapping => mapping.selection ? [{
      slotId: slot.slotId,
      sourceKind: mapping.selection.sourceKind,
      sessionId: mapping.selection.sessionId,
      position: mapping.position,
    }] : [])),
  );
  readonly hasSessionProposalChanges = computed(() => {
    const persisted = this.sessionProposals()?.slots.flatMap(slot => [...slot.mappings].sort(compareByPosition).map(mapping => ({
      slotId: slot.slotId, sourceKind: mapping.sourceKind, sessionId: mapping.sessionId, position: mapping.position,
    }))) ?? [];
    return JSON.stringify(this.sessionProposalPayload()) !== JSON.stringify(persisted);
  });
  readonly canEditSessionProposals = computed(() =>
    this.sessionProposals()?.editable === true && !this.isMutating() && !this.sessionProposalsLoading(),
  );

  readonly loadCandidateThread = (candidateId: string): Observable<StaffingCandidateThread> =>
    this.read.getCandidateThread(candidateId);

  readonly createCandidateMessage = (candidateId: string, body: string): Observable<StaffingCandidateThread> =>
    this.write.createCandidateMessage(candidateId, body);

  constructor() {
    if (inject(Platform).isBrowser) {
      interval(1000).pipe(takeUntilDestroyed()).subscribe(() => this.refreshTime());
    }
  }

  refreshTime(): void {
    this.now.set(Date.now());
  }

  load(realizationId: string): Observable<MyStaffingRealizationDetail> {
    return defer(() => {
      this.detailSource.set(null);
      this.sessionProposalsSource.set(null);
      this.sessionProposalDraftSource.set([]);
      this.sessionProposalsLoadError.set(null);
      this.isLoading.set(true);
      this.loadError.set(null);
      return this.read.getDetail(realizationId).pipe(
        tap(detail => this.detailSource.set(detail)),
        catchError((error: unknown) => {
          this.loadError.set(error);
          return throwError(() => error);
        }),
        finalize(() => this.isLoading.set(false)),
      );
    });
  }

  createSelfApplication(realizationId: string, dayIds: string[] | null): Observable<MyStaffingCandidate> {
    return this.mutate(this.write.createSelfApplication(realizationId, dayIds));
  }

  submitSelfApplication(candidateId: string): Observable<MyStaffingCandidate> {
    return this.mutate(this.write.submitSelfApplication(candidateId));
  }

  withdrawSelfApplication(candidateId: string): Observable<MyStaffingCandidate> {
    return this.mutate(this.write.withdrawSelfApplication(candidateId));
  }

  decideAdminProposal(candidateId: string, decision: 'accepted' | 'rejected'): Observable<MyStaffingCandidate> {
    return this.mutate(this.write.decideAdminProposal(candidateId, decision));
  }

  withdrawConfirmedParticipation(candidateId: string, replacementGmUserId: string | null): Observable<MyStaffingCandidate> {
    return this.mutate(this.write.withdrawConfirmedParticipation(candidateId, replacementGmUserId).pipe(
      map(result => result.candidate),
    )).pipe(tap(() => {
      if (this.detail()?.candidate?.id !== candidateId) return;
      this.sessionProposalsSource.set(null);
      this.sessionProposalDraftSource.set([]);
    }));
  }

  getReplacementGmOptions(candidateId: string): Observable<ISelectOption<string>[]> {
    return this.read.getReplacementCandidates(candidateId).pipe(
      map(candidates => candidates.map(candidate => ({ value: candidate.userId, label: getUserDisplayName(candidate) }))),
    );
  }

  loadSessionProposals(candidateId: string): Observable<StaffingCandidateSessionProposals> {
    return defer(() => {
      const proposals = this.sessionProposals();
      if (proposals?.candidateId === candidateId) return of(proposals);
      this.sessionProposalsLoading.set(true);
      this.sessionProposalsLoadError.set(null);
      return this.read.getSessionProposals(candidateId).pipe(
        tap(result => {
          if (this.sessionProposalCandidateId() !== candidateId) return;
          this.sessionProposalsSource.set(result);
          this.resetSessionProposalDraft();
        }),
        catchError((error: unknown) => {
          if (this.sessionProposalCandidateId() === candidateId) this.sessionProposalsLoadError.set(error);
          return throwError(() => error);
        }),
        finalize(() => this.sessionProposalsLoading.set(false)),
      );
    });
  }

  setSessionProposal(slotId: string, key: string, selection: StaffingSessionReference | null): void {
    if (!this.canEditSessionProposals()) return;
    this.sessionProposalDraftSource.update(slots => slots.map(slot => slot.slotId === slotId ? {
      ...slot, mappings: slot.mappings.map(mapping => mapping.key === key ? { ...mapping, selection } : mapping),
    } : slot));
  }

  addSessionProposal(slotId: string): void {
    if (!this.canEditSessionProposals()) return;
    this.sessionProposalDraftSource.update(slots => slots.map(slot => slot.slotId === slotId ? {
      ...slot,
      mappings: [...slot.mappings, {
        key: `draft-${this.nextSessionMappingKey++}`,
        position: Math.max(0, ...slot.mappings.map(mapping => mapping.position)) + 1,
        selection: null,
      }],
    } : slot));
  }

  removeSessionProposal(slotId: string, key: string): void {
    if (!this.canEditSessionProposals()) return;
    this.sessionProposalDraftSource.update(slots => slots.map(slot => slot.slotId === slotId ? {
      ...slot, mappings: slot.mappings.filter(mapping => mapping.key !== key),
    } : slot));
  }

  resetSessionProposalDraft(): void {
    const proposals = this.sessionProposals();
    this.sessionProposalDraftSource.set(proposals?.slots.map(slot => ({
      ...slot,
      mappings: slot.mappings.length ? [...slot.mappings].sort(compareByPosition).map(mapping => ({
        key: mapping.id,
        position: mapping.position,
        selection: { sourceKind: mapping.sourceKind, sessionId: mapping.sessionId },
      })) : proposals.editable ? [{ key: `draft-${this.nextSessionMappingKey++}`, position: 1, selection: null }] : [],
    })) ?? []);
  }

  saveSessionProposals(): Observable<StaffingCandidateSessionProposals> {
    return defer(() => {
      const candidateId = this.sessionProposalCandidateId();
      if (!candidateId || !this.canEditSessionProposals() || !this.hasSessionProposalChanges()) return EMPTY;
      this.isMutating.set(true);
      return this.write.saveSessionProposals(candidateId, this.sessionProposalPayload()).pipe(
        tap(result => {
          if (this.sessionProposalCandidateId() !== candidateId) return;
          this.sessionProposalsSource.set(result);
          this.resetSessionProposalDraft();
        }),
        finalize(() => this.isMutating.set(false)),
      );
    }).pipe(takeUntilDestroyed(this.destroyRef));
  }

  private mutate(request: Observable<MyStaffingCandidate>): Observable<MyStaffingCandidate> {
    return defer(() => {
      if (this.isMutating()) return EMPTY;
      const realizationId = this.detail()?.id;
      this.isMutating.set(true);
      return request.pipe(
        tap(candidate => this.detailSource.update(detail =>
          detail && detail.id === realizationId ? { ...detail, candidate } : detail,
        )),
        finalize(() => this.isMutating.set(false)),
      );
    }).pipe(takeUntilDestroyed(this.destroyRef));
  }
}
