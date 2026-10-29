import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, defer, EMPTY, finalize, map, Observable, of, Subscription, switchMap, tap, throwError } from 'rxjs';

import type { AdminEventTimeline } from '../../../../core/interfaces/i-admin-event-timeline';
import type { IGmPublicProfile } from '../../../../core/interfaces/i-gm-public-profile';
import type { ManualRpgSlotPayload, ManualRpgSlotResult } from '../../../../core/interfaces/i-event-program-item';
import type { ISessionWithRelations } from '../../../../core/interfaces/i-session';
import { GmRead } from '../../../../core/reads/gm/gm-read';
import { SessionRead } from '../../../../core/reads/sessions/session-read';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { RpcError } from '../../../../core/types/rpc-error';
import { EdgeFunctionError } from '../../../../core/types/edge-function-error';
import { assertEdgeContract, readEdgeObject, readEdgeUuid } from '../../../../core/utils/edge-contract';
import { setControlEnabled } from '../../../../core/utils/form-controls';
import { formatTimeLabel } from '../../../../core/utils/time-format';
import { canAddManualRpg, createManualRpgForm, manualRpgBlocks, manualRpgIntervalValid, mapManualRpgSlot, matchesManualRpg, type ManualRpgContext } from './event-manual-rpg-state';

interface ManualRpgTarget { coreId: string; editionId: string; occurrenceId: string; date: string }
interface ManualRpgCommand extends ManualRpgTarget { payload: ManualRpgSlotPayload; blockPosition: number }
type PendingRpgSave = { command: ManualRpgCommand } & (
  | { kind: 'confirmed'; confirmation: ManualRpgSlotResult }
  | { kind: 'uncertain' | 'contractFailure' }
);
type ManualRpgOperation =
  | { phase: 'idle' | 'editing' | 'conflict' | 'refreshRequired'; error?: unknown }
  | { phase: 'saving'; command: ManualRpgCommand }
  | { phase: 'reading' | 'unresolved'; pending: PendingRpgSave; error?: unknown }
  | { phase: 'refreshing'; resume: 'editing' | 'refreshRequired' };

export interface ManualRpgReadback { timeline: AdminEventTimeline; saved: boolean }

@Injectable()
export class EventManualRpgController {
  private readonly admin = inject(EventAdmin);
  private readonly gms = inject(GmRead);
  private readonly sessions = inject(SessionRead);
  private readonly destroyRef = inject(DestroyRef);
  private catalogRequest: Subscription | null = null;
  readonly operation = signal<ManualRpgOperation>({ phase: 'idle' });
  readonly context = signal<ManualRpgContext | null>(null);
  readonly form = createManualRpgForm();
  readonly blocked = signal(false);
  readonly profiles = signal<IGmPublicProfile[]>([]);
  readonly catalog = signal<ISessionWithRelations[]>([]);
  readonly catalogBusy = signal(false);
  readonly catalogError = signal(false);
  readonly isBusy = computed(() => ['saving', 'reading', 'refreshing'].includes(this.operation().phase));
  readonly readbackPending = computed(() => ['saving', 'reading', 'unresolved'].includes(this.operation().phase));
  readonly editing = computed(() => { const state = this.operation(); return state.phase === 'refreshing'
    ? state.resume === 'editing' : !['idle', 'refreshRequired'].includes(state.phase); });
  readonly locked = computed(() => this.editing() || this.isBusy());
  readonly needsRefresh = computed(() => { const state = this.operation(); return state.phase === 'refreshRequired' ||
    (state.phase === 'refreshing' && state.resume === 'refreshRequired'); });
  readonly canAbandon = computed(() => this.operation().phase === 'unresolved');
  readonly conflict = computed(() => this.operation().phase === 'conflict');
  readonly contractFailure = computed(() => { const state = this.operation(); return 'pending' in state && state.pending.kind === 'contractFailure'; });
  readonly error = computed(() => { const state = this.operation(); return 'error' in state ? state.error ?? null : null; });
  readonly blocks = computed(() => { const context = this.context(); return context ? manualRpgBlocks(context) : []; });
  readonly canOpen = computed(() => { const context = this.context(); return this.operation().phase === 'idle' &&
    !this.blocked() && !!context && canAddManualRpg(context); });

  constructor() {
    effect(() => setControlEnabled(this.form, !this.blocked() && !this.isBusy() && !this.readbackPending()));
    this.destroyRef.onDestroy(() => this.catalogRequest?.unsubscribe());
  }

  reset(): void { this.context.set(null); this.clearLocal('idle'); }

  open(): void {
    const context = this.context();
    if (!this.canOpen() || !context) return;
    this.clearLocal('editing');
    const rows = context.timeline()?.occurrences.find(row => row.occurrenceId === context.occurrence.id)?.rows ?? [];
    this.form.controls.position.setValue(Math.max(0, ...rows.map(row => row.position ?? 0)) + 1);
    this.loadProfiles();
  }

  loadProfiles(): void {
    if (!this.editing() || this.readbackPending() || this.isBusy()) return;
    this.loadCatalog(this.gms.getNonArchivedProfiles(), profiles => this.profiles.set(profiles));
  }

  loadSessions(): void {
    if (!this.editing() || this.readbackPending() || this.isBusy()) return;
    this.catalogRequest?.unsubscribe();
    this.catalogBusy.set(false);
    this.catalogError.set(false);
    this.catalog.set([]);
    this.form.controls.sessionId.reset();
    const { gmUserId, sessionKind } = this.form.getRawValue();
    if (!this.profiles().some(profile => profile.user.id === gmUserId)) return;
    this.loadCatalog(this.sessions.getSessionsByGmProfileId(gmUserId, sessionKind), sessions => this.catalog.set(sessions));
  }

  selectBlock(): void {
    if (this.isBusy() || this.readbackPending()) return;
    const block = this.blocks().find(block => block.position === this.form.controls.blockPosition.value);
    if (block) this.form.patchValue({ startTime: formatTimeLabel(block.startTime), endTime: formatTimeLabel(block.endTime),
      startDayOffset: block.startDayOffset, endDayOffset: block.endDayOffset });
  }

  canSave(): boolean {
    const context = this.context();
    const value = this.form.getRawValue();
    return this.operation().phase === 'editing' && !this.blocked() && !this.catalogBusy() && !this.catalogError() &&
      this.form.valid && !!context && canAddManualRpg(context) && manualRpgIntervalValid(value, this.blocks()) && !this.positionTaken() &&
      this.profiles().some(profile => profile.user.id === value.gmUserId) &&
      this.catalog().some(session => session.id === value.sessionId && session.gmProfileId === value.gmUserId);
  }

  positionTaken(): boolean {
    const context = this.context();
    return context?.timeline()?.occurrences.find(row => row.occurrenceId === context.occurrence.id)?.rows
      .some(row => row.position === this.form.controls.position.value) ?? false;
  }

  canDiscard(): boolean { return ['editing', 'conflict'].includes(this.operation().phase); }
  discard(): void { if (this.canDiscard()) this.clearLocal('idle'); }
  abandon(): boolean {
    if (!this.canAbandon()) return false;
    this.clearLocal('refreshRequired');
    return true;
  }

  save(): Observable<ManualRpgReadback> {
    return defer(() => {
      const context = this.context();
      if (!this.canSave() || !context) return EMPTY;
      const payload = mapManualRpgSlot(this.form, context);
      const blockPosition = this.form.controls.blockPosition.value;
      assertEdgeContract(blockPosition !== null, 'manualRpgSlot.block', 'the selected effective block');
      const command = { ...this.target(context), payload, blockPosition };
      this.operation.set({ phase: 'saving', command });
      return this.admin.saveManualRpgSlot(payload).pipe(
        map((result): PendingRpgSave => {
          const value = readEdgeObject(result, 'manualRpgSave');
          readEdgeUuid(value['programItemId'], 'manualRpgSave.programItemId');
          assertEdgeContract(value['status'] === 'pending' && (value['effectivePlayerCapacity'] === null ||
            (typeof value['effectivePlayerCapacity'] === 'number' && Number.isInteger(value['effectivePlayerCapacity']) && value['effectivePlayerCapacity'] > 0)),
          'manualRpgSave', 'an unpublished program item and its effective capacity');
          return { command, kind: 'confirmed', confirmation: result };
        }),
        catchError((error: unknown) => {
          if (error instanceof RpcError && ['42501', '22023', '22P02', '22007', '23503', '23505', '23514', '40001', 'P0002'].includes(error.code)) {
            this.operation.set({ phase: error.code === '40001' || error.code === '23505' ? 'conflict' : 'editing', error });
            return throwError(() => error);
          }
          return of<PendingRpgSave>({ command, kind: error instanceof EdgeFunctionError ? 'contractFailure' : 'uncertain' });
        }),
        switchMap(pending => this.readback(pending)),
      );
    });
  }

  refresh(): Observable<ManualRpgReadback> {
    return defer(() => {
      const state = this.operation();
      const context = this.context();
      if (!context || this.isBusy() || this.blocked()) return EMPTY;
      if (state.phase === 'unresolved') return this.readback(state.pending);
      const resume = this.editing() ? 'editing' : 'refreshRequired';
      const target = this.target(context);
      this.operation.set({ phase: 'refreshing', resume });
      return this.admin.getTimeline(target.editionId).pipe(map(timeline => {
        this.assertIdentity(timeline, target);
        this.operation.set({ phase: resume === 'editing' ? 'editing' : 'idle' });
        return { timeline, saved: false };
      }), tap({ error: error => this.operation.set({ phase: resume === 'editing' ? 'conflict' : 'refreshRequired', error }) }));
    });
  }

  private readback(pending: PendingRpgSave): Observable<ManualRpgReadback> {
    return defer(() => {
      this.operation.set({ phase: 'reading', pending });
      return this.admin.getTimeline(pending.command.editionId);
    }).pipe(map(timeline => {
      const { command } = pending;
      const occurrence = this.assertIdentity(timeline, command);
      if (pending.kind !== 'confirmed') {
        // A matching payload cannot attribute a concurrent author's row to this uncertain SAVE.
        this.operation.set({ phase: 'unresolved', pending });
        return { timeline, saved: false };
      }
      const { confirmation } = pending;
      const rows = occurrence.rows.filter(row => row.programItemId === confirmation.programItemId);
      const row = rows[0];
      assertEdgeContract(rows.length === 1 && row?.source === 'manual' && matchesManualRpg(row, command.payload) &&
        row.blockPosition === command.blockPosition && row.status === confirmation.status &&
        row.session?.effectiveCapacity === confirmation.effectivePlayerCapacity,
      'manualRpgReadback.item', 'the server-confirmed program item with the submitted placement and capacity');
      this.clearLocal('idle');
      return { timeline, saved: true };
    }), tap({ error: error => this.operation.set({ phase: 'unresolved', pending, error }) }));
  }

  private target(context: ManualRpgContext): ManualRpgTarget {
    return { coreId: context.core.id, editionId: context.edition.id, occurrenceId: context.occurrence.id, date: context.occurrence.date };
  }

  private assertIdentity(timeline: AdminEventTimeline, target: ManualRpgTarget) {
    const matches = timeline.occurrences.filter(row => row.occurrenceId === target.occurrenceId && row.date === target.date);
    const occurrence = matches[0];
    assertEdgeContract(timeline.eventId === target.editionId && timeline.eventCoreId === target.coreId && matches.length === 1 && !!occurrence,
      'manualRpgReadback', 'the selected Core, Edition and real Occurrence/date');
    return occurrence;
  }

  private clearLocal(phase: 'idle' | 'editing' | 'refreshRequired'): void {
    this.catalogRequest?.unsubscribe();
    this.catalogRequest = null;
    this.form.reset();
    this.catalog.set([]);
    this.profiles.set([]);
    this.catalogBusy.set(false);
    this.catalogError.set(false);
    this.operation.set({ phase });
  }

  private loadCatalog<T>(request: Observable<T>, accept: (value: T) => void): void {
    this.catalogRequest?.unsubscribe();
    this.catalogBusy.set(true);
    this.catalogError.set(false);
    this.catalogRequest = request.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.catalogBusy.set(false))).subscribe({
      next: accept, error: () => this.catalogError.set(true),
    });
  }
}
