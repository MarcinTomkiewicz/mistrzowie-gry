import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, defer, EMPTY, finalize, map, Observable, of, Subscription, switchMap, tap, throwError } from 'rxjs';

import type { AdminEventTimeline } from '../../../../core/interfaces/i-admin-event-timeline';
import type { AdminEventActivityKind } from '../../../../core/interfaces/i-admin-event-activity';
import type { IGmPublicProfile } from '../../../../core/interfaces/i-gm-public-profile';
import type { ISessionWithRelations } from '../../../../core/interfaces/i-session';
import { GmRead } from '../../../../core/reads/gm/gm-read';
import { SessionRead } from '../../../../core/reads/sessions/session-read';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { RpcError } from '../../../../core/types/rpc-error';
import { EdgeFunctionError } from '../../../../core/types/edge-function-error';
import { assertEdgeContract } from '../../../../core/utils/edge-contract';
import { setControlEnabled } from '../../../../core/utils/form-controls';
import { formatTimeLabel } from '../../../../core/utils/time-format';
import {
  assertManualActivitySave, assertManualRpgSave, canAddManualProgram, createManualActivityForm, createManualRpgForm,
  manualProgramBlocks, manualProgramIntervalValid, mapManualActivity, mapManualRpgSlot, matchesConfirmedManualProgram, readActiveActivityKinds,
  type ConfirmedManualProgramCommand, type ManualProgramCommand, type ManualProgramContext, type ManualProgramKind, type ManualProgramTarget,
} from './event-manual-program-state';

type PendingProgramSave =
  | { kind: 'confirmed'; command: ConfirmedManualProgramCommand }
  | { kind: 'uncertain' | 'contractFailure'; command: ManualProgramCommand };
type ManualProgramOperation =
  | { phase: 'idle' | 'refreshRequired'; error?: unknown }
  | { phase: 'editing' | 'conflict'; mode: ManualProgramKind; error?: unknown }
  | { phase: 'saving'; command: ManualProgramCommand }
  | { phase: 'reading' | 'unresolved'; pending: PendingProgramSave; error?: unknown }
  | { phase: 'refreshing'; mode: ManualProgramKind | null };

export interface ManualProgramReadback { timeline: AdminEventTimeline; saved: boolean }

@Injectable()
export class EventManualProgramController {
  private readonly admin = inject(EventAdmin);
  private readonly gms = inject(GmRead);
  private readonly sessions = inject(SessionRead);
  private readonly destroyRef = inject(DestroyRef);
  private catalogRequest: Subscription | null = null;
  readonly operation = signal<ManualProgramOperation>({ phase: 'idle' });
  readonly context = signal<ManualProgramContext | null>(null);
  readonly rpgForm = createManualRpgForm();
  readonly activityForm = createManualActivityForm();
  readonly blocked = signal(false);
  readonly profiles = signal<IGmPublicProfile[]>([]);
  readonly catalog = signal<ISessionWithRelations[]>([]);
  readonly activityKinds = signal<AdminEventActivityKind[]>([]);
  readonly catalogBusy = signal(false);
  readonly catalogError = signal(false);
  readonly mode = computed(() => {
    const state = this.operation();
    if ('mode' in state) return state.mode;
    if ('command' in state) return state.command.kind;
    return 'pending' in state ? state.pending.command.kind : null;
  });
  readonly isBusy = computed(() => ['saving', 'reading', 'refreshing'].includes(this.operation().phase));
  readonly readbackPending = computed(() => ['saving', 'reading', 'unresolved'].includes(this.operation().phase));
  readonly editing = computed(() => this.mode() !== null);
  readonly locked = computed(() => this.editing() || this.isBusy());
  readonly needsRefresh = computed(() => this.operation().phase === 'refreshRequired' ||
    (this.operation().phase === 'refreshing' && this.mode() === null));
  readonly canAbandon = computed(() => this.operation().phase === 'unresolved');
  readonly conflict = computed(() => this.operation().phase === 'conflict');
  readonly contractFailure = computed(() => { const state = this.operation(); return 'pending' in state && state.pending.kind === 'contractFailure'; });
  readonly error = computed(() => { const state = this.operation(); return 'error' in state ? state.error ?? null : null; });
  readonly blocks = computed(() => { const context = this.context(); return context ? manualProgramBlocks(context) : []; });
  readonly canOpen = computed(() => { const context = this.context(); return this.operation().phase === 'idle' &&
    !this.blocked() && !!context && canAddManualProgram(context); });

  get form() { return this.mode() === 'activity' ? this.activityForm : this.rpgForm; }

  constructor() {
    effect(() => {
      const enabled = !this.blocked() && !this.isBusy() && !this.readbackPending();
      setControlEnabled(this.rpgForm, enabled && this.mode() === 'rpg');
      setControlEnabled(this.activityForm, enabled && this.mode() === 'activity');
    });
    this.destroyRef.onDestroy(() => this.catalogRequest?.unsubscribe());
  }

  reset(): void { this.context.set(null); this.clearLocal({ phase: 'idle' }); }

  open(mode: ManualProgramKind): void {
    const context = this.context();
    if (!this.canOpen() || !context) return;
    this.clearLocal({ phase: 'editing', mode });
    const rows = context.timeline()?.occurrences.find(row => row.occurrenceId === context.occurrence.id)?.rows ?? [];
    this.form.controls.position.setValue(Math.max(0, ...rows.map(row => row.position ?? 0)) + 1);
    if (mode === 'rpg') this.loadProfiles();
    else this.loadActivityKinds();
  }

  loadProfiles(): void {
    if (this.mode() !== 'rpg' || this.readbackPending() || this.isBusy()) return;
    this.loadCatalog(this.gms.getNonArchivedProfiles(), profiles => this.profiles.set(profiles));
  }

  loadSessions(): void {
    if (this.mode() !== 'rpg' || this.readbackPending() || this.isBusy()) return;
    this.catalogRequest?.unsubscribe();
    this.catalogBusy.set(false);
    this.catalogError.set(false);
    this.catalog.set([]);
    this.rpgForm.controls.sessionId.reset();
    const { gmUserId, sessionKind } = this.rpgForm.getRawValue();
    if (!this.profiles().some(profile => profile.user.id === gmUserId)) return;
    this.loadCatalog(this.sessions.getSessionsByGmProfileId(gmUserId, sessionKind), sessions => this.catalog.set(sessions));
  }

  loadActivityKinds(): void {
    if (this.mode() !== 'activity' || this.readbackPending() || this.isBusy()) return;
    this.loadCatalog(this.admin.getActivityKinds().pipe(map(readActiveActivityKinds)), kinds => this.activityKinds.set(kinds));
  }

  selectBlock(): void {
    if (this.isBusy() || this.readbackPending()) return;
    const block = this.blocks().find(block => block.position === this.form.controls.blockPosition.value);
    if (block) this.form.patchValue({ startTime: formatTimeLabel(block.startTime), endTime: formatTimeLabel(block.endTime),
      startDayOffset: block.startDayOffset, endDayOffset: block.endDayOffset });
  }

  canSave(): boolean {
    const context = this.context();
    if (this.operation().phase !== 'editing' || this.blocked() || this.catalogBusy() || this.catalogError() || !this.form.valid ||
      !context || !canAddManualProgram(context) || !manualProgramIntervalValid(this.form.getRawValue(), this.blocks()) || this.positionTaken()) return false;
    if (this.mode() === 'activity') return this.activityKinds().some(kind => kind.key === this.activityForm.controls.kindKey.value && kind.isActive);
    const value = this.rpgForm.getRawValue();
    return this.profiles().some(profile => profile.user.id === value.gmUserId) &&
      this.catalog().some(session => session.id === value.sessionId && session.gmProfileId === value.gmUserId);
  }

  positionTaken(): boolean {
    const context = this.context();
    return context?.timeline()?.occurrences.find(row => row.occurrenceId === context.occurrence.id)?.rows
      .some(row => row.position === this.form.controls.position.value) ?? false;
  }

  canDiscard(): boolean { return ['editing', 'conflict'].includes(this.operation().phase); }
  discard(): void { if (this.canDiscard()) this.clearLocal({ phase: 'idle' }); }
  abandon(): boolean {
    if (!this.canAbandon()) return false;
    this.clearLocal({ phase: 'refreshRequired' });
    return true;
  }

  save(): Observable<ManualProgramReadback> {
    return defer(() => {
      const context = this.context();
      const kind = this.mode();
      if (!this.canSave() || !context || !kind) return EMPTY;
      const blockPosition = this.form.controls.blockPosition.value;
      assertEdgeContract(blockPosition !== null, 'manualProgram.block', 'the selected effective block');
      const target = { ...this.target(context), blockPosition };
      const command: ManualProgramCommand = kind === 'rpg' ? { ...target, kind, payload: mapManualRpgSlot(this.rpgForm, context) }
        : { ...target, kind, payload: mapManualActivity(this.activityForm, context) };
      this.operation.set({ phase: 'saving', command });
      return this.write(command).pipe(
        map((command): PendingProgramSave => ({ kind: 'confirmed', command })),
        catchError((error: unknown) => {
          if (error instanceof RpcError && ['42501', '22023', '22P02', '22007', '23503', '23505', '23514', '40001', 'P0002'].includes(error.code)) {
            this.operation.set({ phase: error.code === '40001' || error.code === '23505' ? 'conflict' : 'editing', mode: kind, error });
            return throwError(() => error);
          }
          return of<PendingProgramSave>({ command, kind: error instanceof EdgeFunctionError ? 'contractFailure' : 'uncertain' });
        }),
        switchMap(pending => this.readback(pending)),
      );
    });
  }

  refresh(): Observable<ManualProgramReadback> {
    return defer(() => {
      const state = this.operation();
      const context = this.context();
      if (!context || this.isBusy() || this.blocked()) return EMPTY;
      if (state.phase === 'unresolved') return this.readback(state.pending);
      const mode = this.mode();
      const target = this.target(context);
      this.operation.set({ phase: 'refreshing', mode });
      return this.admin.getTimeline(target.editionId).pipe(map(timeline => {
        this.assertIdentity(timeline, target);
        this.operation.set(mode ? { phase: 'editing', mode } : { phase: 'idle' });
        return { timeline, saved: false };
      }), tap({ error: error => this.operation.set(mode ? { phase: 'conflict', mode, error } : { phase: 'refreshRequired', error }) }));
    });
  }

  private write(command: ManualProgramCommand): Observable<ConfirmedManualProgramCommand> {
    if (command.kind === 'rpg') return this.admin.saveManualRpgSlot(command.payload).pipe(map(confirmation => {
      assertManualRpgSave(confirmation);
      return { ...command, confirmation };
    }));
    return this.admin.saveManualActivity(command.payload).pipe(map(confirmation => {
      assertManualActivitySave(confirmation, command);
      return { ...command, confirmation };
    }));
  }

  private readback(pending: PendingProgramSave): Observable<ManualProgramReadback> {
    return defer(() => {
      this.operation.set({ phase: 'reading', pending });
      return this.admin.getTimeline(pending.command.editionId);
    }).pipe(map(timeline => {
      const occurrence = this.assertIdentity(timeline, pending.command);
      if (pending.kind !== 'confirmed') {
        // Matching input never attributes a concurrent author's row to an uncertain SAVE.
        this.operation.set({ phase: 'unresolved', pending });
        return { timeline, saved: false };
      }
      assertEdgeContract(occurrence.rows.filter(row => matchesConfirmedManualProgram(row, pending.command)).length === 1,
        'manualProgramReadback.item', 'the server-confirmed item with the submitted placement and values');
      this.clearLocal({ phase: 'idle' });
      return { timeline, saved: true };
    }), tap({ error: error => this.operation.set({ phase: 'unresolved', pending, error }) }));
  }

  private target(context: ManualProgramContext): ManualProgramTarget {
    return { coreId: context.core.id, editionId: context.edition.id, occurrenceId: context.occurrence.id, date: context.occurrence.date };
  }

  private assertIdentity(timeline: AdminEventTimeline, target: ManualProgramTarget) {
    const matches = timeline.occurrences.filter(row => row.occurrenceId === target.occurrenceId && row.date === target.date);
    const occurrence = matches[0];
    assertEdgeContract(timeline.eventId === target.editionId && timeline.eventCoreId === target.coreId && matches.length === 1 && !!occurrence,
      'manualProgramReadback', 'the selected Core, Edition and real Occurrence/date');
    return occurrence;
  }

  private clearLocal(operation: ManualProgramOperation): void {
    this.catalogRequest?.unsubscribe();
    this.catalogRequest = null;
    this.rpgForm.reset();
    this.activityForm.reset();
    this.catalog.set([]);
    this.profiles.set([]);
    this.activityKinds.set([]);
    this.catalogBusy.set(false);
    this.catalogError.set(false);
    this.operation.set(operation);
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
