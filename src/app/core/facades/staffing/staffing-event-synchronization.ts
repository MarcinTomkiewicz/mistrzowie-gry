import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, map, Observable, of, switchMap, tap, timeout } from 'rxjs';

import { AdminStaffingRealizationRead } from '../../reads/staffing/admin-staffing-realization-read';
import { EventAdmin } from '../../services/event-admin/event-admin';
import { RpcError } from '../../types/rpc-error';
import { assertEdgeContract } from '../../utils/edge-contract';
import {
  assertPrivateStaffingSyncResult, assertReleasedStaffingSyncResult, assertStaffingEventReadback, assertStaffingEventSourceUnchanged,
  type StaffingEventSyncConfirmation, type StaffingEventSyncContext, type StaffingEventSyncSnapshot,
  type StaffingEventSyncState, type StaffingEventSyncTrigger,
} from './staffing-event-synchronization-state';

@Injectable({ providedIn: 'root' })
export class StaffingEventSynchronization {
  private readonly read = inject(AdminStaffingRealizationRead);
  private readonly admin = inject(EventAdmin);
  private readonly destroyRef = inject(DestroyRef);
  private readonly states = signal<ReadonlyMap<string, StaffingEventSyncState>>(new Map());

  state(realizationId: string): StaffingEventSyncState | null {
    return this.states().get(realizationId) ?? null;
  }

  busy(realizationId: string): boolean {
    const phase = this.state(realizationId)?.phase;
    return phase === 'checking' || phase === 'writing' || phase === 'reading';
  }

  locked(realizationId: string): boolean {
    return this.busy(realizationId) || this.canAbandon(realizationId);
  }

  canAbandon(realizationId: string): boolean {
    const state = this.state(realizationId);
    return !!state && !state.abandoned && (state.phase === 'uncertain' || state.phase === 'readback');
  }

  abandon(realizationId: string, expectedState: StaffingEventSyncState): void {
    if (this.state(realizationId) !== expectedState || !this.canAbandon(realizationId)) return;
    this.patch(realizationId, { abandoned: true });
  }

  start(realizationId: string, trigger: StaffingEventSyncTrigger): void {
    if (this.locked(realizationId)) return;
    this.set(realizationId, { phase: 'checking', abandoned: false, trigger, context: null, confirmation: null, snapshot: null, error: null });
    let writeStarted = false;
    // The root-owned subscription retains the operation when a Staffing tab/editor is destroyed.
    this.readContext(realizationId, trigger).pipe(
      switchMap(context => {
        if (context === null) { this.patch(realizationId, { phase: 'skipped' }); return of(null); }
        this.patch(realizationId, { context, phase: 'writing' });
        writeStarted = true;
        return this.write(context).pipe(
          tap(confirmation => this.patch(realizationId, { confirmation, phase: 'reading' })),
          switchMap(confirmation => this.readback(context, confirmation)),
        );
      }),
      timeout({ first: 30_000 }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: snapshot => { if (snapshot) this.patch(realizationId, { phase: 'verified', snapshot, error: null }); },
      error: (error: unknown) => {
        const confirmation = this.state(realizationId)?.confirmation;
        const refused = error instanceof RpcError &&
          ['22023', '22P02', 'P0002', '42501', '23514', '23503', '23505', '40001'].includes(error.code);
        this.patch(realizationId, { error, phase: confirmation ? 'readback' : writeStarted && !refused ? 'uncertain' : 'failed' });
      },
    });
  }

  retryReadback(realizationId: string): void {
    const state = this.state(realizationId);
    if (!state?.context || (state.phase !== 'uncertain' && state.phase !== 'readback')) return;
    this.patch(realizationId, { phase: 'reading', error: null });
    this.readback(state.context, state.confirmation).pipe(
      timeout({ first: 30_000 }), takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: snapshot => this.patch(realizationId, { phase: 'verified', abandoned: false, snapshot, error: null }),
      error: (error: unknown) => this.patch(realizationId, { phase: state.phase, error }),
    });
  }

  retry(realizationId: string): void {
    const state = this.state(realizationId);
    if (state?.phase === 'failed') this.start(realizationId, state.trigger);
  }

  private readContext(realizationId: string, trigger: StaffingEventSyncTrigger): Observable<StaffingEventSyncContext | null> {
    return this.read.getDetail(realizationId).pipe(switchMap(realization => {
      assertEdgeContract(realization.id === realizationId, 'staffingSync.source', 'the saved Staffing realization');
      const eventId = realization.eventId;
      if (!eventId || realization.status === 'archived') return of(null);
      return this.admin.getEditionDetail(eventId).pipe(switchMap(edition => {
        assertEdgeContract(edition !== null && edition.id === eventId, 'staffingSync.edition', 'the linked Edition');
        if (!edition.isStaffingConverted || (edition.isStaffingReleased &&
          (trigger !== 'finalPlan' || !edition.currentlyPublic || !edition.isActive))) return of(null);
        return forkJoin({ schedule: this.read.getSchedule(realizationId), plan: this.read.getFinalPlan(realizationId) }).pipe(map(source => {
          assertEdgeContract(source.schedule.realizationId === realizationId && source.plan.realizationId === realizationId,
            'staffingSync.source', 'the saved Staffing schedule and final plan');
          return { ...source, realization, edition, kind: edition.isStaffingReleased ? 'released' as const : 'private' as const };
        }));
      }));
    }));
  }

  private write(context: StaffingEventSyncContext): Observable<StaffingEventSyncConfirmation> {
    if (context.kind === 'private') return this.admin.syncStaffingPrivateEvent(context.edition.id).pipe(
      tap(result => assertPrivateStaffingSyncResult(result, context)),
      map(result => ({ kind: 'private' as const, result })),
    );
    return this.admin.reconcileStaffingEventProgram(context.edition.id).pipe(
      tap(result => assertReleasedStaffingSyncResult(result, context)),
      map(result => ({ kind: 'released' as const, result })),
    );
  }

  private readback(context: StaffingEventSyncContext, confirmation: StaffingEventSyncConfirmation | null): Observable<StaffingEventSyncSnapshot> {
    return forkJoin({
      realization: this.read.getDetail(context.realization.id),
      schedule: this.read.getSchedule(context.realization.id),
      plan: this.read.getFinalPlan(context.realization.id),
      core: this.admin.getCoreDetail(context.edition.eventCoreId),
      edition: this.admin.getEditionDetail(context.edition.id),
      timeline: this.admin.getTimeline(context.edition.id),
    }).pipe(map(({ realization, schedule, plan, core, edition, timeline }) => {
      assertEdgeContract(realization.id === context.realization.id && realization.eventId === context.edition.id && core !== null && edition !== null,
        'staffingSync.readback', 'the unchanged realization-to-Core/Edition association');
      assertStaffingEventSourceUnchanged(schedule, plan, context);
      const snapshot = { core, edition, timeline };
      assertStaffingEventReadback(snapshot, context, confirmation);
      return snapshot;
    }));
  }

  private set(realizationId: string, state: StaffingEventSyncState): void {
    this.states.update(states => new Map(states).set(realizationId, state));
  }

  private patch(realizationId: string, update: Partial<StaffingEventSyncState>): void {
    const state = this.state(realizationId);
    if (state) this.set(realizationId, { ...state, ...update });
  }
}
