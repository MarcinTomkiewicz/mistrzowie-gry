import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, defer, EMPTY, finalize, map, Observable, of, switchMap, tap, throwError, timeout } from 'rxjs';

import type { AdminEventCoreDispositionPreview, AdminEventCoreDispositionResult,
  EventCoreCoverCleanupJob, EventCoreDispositionCommand } from '../../../../core/interfaces/i-event-admin';
import { readAdminEventCoreDisposition } from '../../../../core/reads/events/admin-event-core-disposition-read';
import { Auth } from '../../../../core/services/auth/auth';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { Platform } from '../../../../core/services/platform/platform';
import { Storage } from '../../../../core/services/storage/storage';
import { assertEdgeContract } from '../../../../core/utils/edge-contract';
import type { EventCoreListRow } from '../../../../core/utils/event-admin-list';
import { isDefiniteEventAdminRpcRejection } from '../event-admin-errors';

type DispositionContext = {
  command: EventCoreDispositionCommand;
  preview: AdminEventCoreDispositionPreview;
  actorId: string;
};
type DispositionPhase = 'idle' | 'preview' | 'apply' | 'readback';
type CleanupPhase = 'claim' | 'remove' | 'complete';
type CleanupFailure = { phase: CleanupPhase; error: unknown; jobId: string | null };

@Injectable()
export class EventCoreDispositionController {
  private readonly admin = inject(EventAdmin);
  private readonly auth = inject(Auth);
  private readonly platform = inject(Platform);
  private readonly storage = inject(Storage);
  private readonly pending = signal<DispositionContext | null>(null);
  private readonly previewActorId = signal<string | null>(null);
  readonly phase = signal<DispositionPhase>('idle');
  readonly preview = signal<AdminEventCoreDispositionPreview | null>(null);
  readonly result = signal<AdminEventCoreDispositionResult | null>(null);
  readonly verified = signal(false);
  readonly error = signal<unknown | null>(null);
  readonly errorPhase = signal<Exclude<DispositionPhase, 'idle'> | null>(null);
  readonly cleanupActive = signal(false);
  readonly cleanupRemoved = signal(false);
  readonly cleanupFailures = signal<CleanupFailure[]>([]);
  readonly cleanupBusy = signal(false);
  readonly busy = computed(() => this.phase() !== 'idle');
  readonly needsReadback = computed(() => this.pending() !== null);
  readonly locked = computed(() => this.busy() || this.needsReadback() || this.cleanupBusy());
  readonly canApply = computed(() => this.allowed() && !this.locked() && !this.verified() &&
    this.previewActorId() === this.auth.userId() && this.result() === null && this.preview()?.status === 'ready');

  invalidate(): void {
    if (this.locked()) return;
    this.preview.set(null);
    this.previewActorId.set(null);
    this.result.set(null);
    this.verified.set(false);
    this.error.set(null);
    this.errorPhase.set(null);
  }

  prepare(coreIds: readonly string[]): Observable<AdminEventCoreDispositionPreview> {
    return defer(() => {
      const actorId = this.auth.userId();
      if (!this.allowed() || this.locked() || !actorId) return EMPTY;
      this.invalidate();
      this.phase.set('preview');
      return this.run(this.admin.previewCoreDisposition([...coreIds]).pipe(tap(preview => {
        this.assertActor(actorId);
        this.previewActorId.set(actorId);
        this.preview.set(preview);
      })));
    });
  }

  apply(includeArchived: boolean): Observable<EventCoreListRow[]> {
    return defer(() => {
      const preview = this.preview();
      const actorId = this.auth.userId();
      if (!this.canApply() || !preview || !actorId) return EMPTY;
      const context: DispositionContext = { actorId, preview, command: {
        requestId: crypto.randomUUID(), coreIds: [...preview.coreIds], planHash: preview.planHash,
      } };
      this.pending.set(context);
      return this.execute(context, includeArchived);
    });
  }

  retry(includeArchived: boolean): Observable<EventCoreListRow[]> {
    return defer(() => {
      const context = this.pending();
      if (!context || this.busy() || this.cleanupBusy() || !this.allowed() || context.actorId !== this.auth.userId()) return EMPTY;
      return this.execute(context, includeArchived);
    });
  }

  resumeCleanup(): Observable<void> {
    return defer(() => {
      const actorId = this.auth.userId();
      if (!actorId || !this.allowed() || this.locked()) return EMPTY;
      this.cleanupBusy.set(true);
      this.cleanupRemoved.set(false);
      return this.drainCleanup(actorId).pipe(finalize(() => {
        this.cleanupBusy.set(false);
        this.cleanupActive.set(false);
      }));
    });
  }

  private drainCleanup(actorId: string): Observable<void> {
    return this.cleanupStep('claim', actorId, () => this.admin.claimCoreCoverCleanup(1)).pipe(switchMap(jobs => {
      this.cleanupFailures.update(failures => failures.filter(failure =>
        failure.phase !== 'claim' || failure.jobId !== null));
      const job = jobs[0];
      // An empty claim means no task is available now; backoff or another lease may still hide queued work.
      if (!job) return of(void 0);
      this.cleanupActive.set(true);
      return this.removeCleanupJob(job, actorId).pipe(switchMap(() => this.drainCleanup(actorId)));
    }));
  }

  private removeCleanupJob(job: EventCoreCoverCleanupJob, actorId: string): Observable<void> {
    return this.cleanupStep('remove', actorId, () => this.storage.removeFiles([job.path], job.bucket), job.jobId).pipe(
      map(() => ({ removed: true as const })),
      catchError((error: unknown) => of({ removed: false as const, error })),
      switchMap(attempt => this.cleanupStep('complete', actorId, () => this.admin.completeCoreCoverCleanup(
        job, attempt.removed ? null : 'EFS095_STORAGE_REMOVE_FAILED',
      ), job.jobId).pipe(
        tap(receipt => {
          if (receipt.state !== 'done') return;
          this.cleanupRemoved.set(true);
          this.cleanupFailures.update(failures => failures.filter(failure => failure.jobId !== receipt.jobId));
        }),
        // A confirmed pending receipt also ends this run; later visits recover through the durable queue.
        switchMap(() => attempt.removed ? of(void 0) : throwError(() => attempt.error)),
      )),
    );
  }

  private cleanupStep<T>(phase: CleanupPhase, actorId: string, request: () => Observable<T>, jobId: string | null = null): Observable<T> {
    return defer(() => {
      this.assertActor(actorId);
      return request().pipe(timeout({ first: 30_000 }), tap(() => this.assertActor(actorId)));
    }).pipe(catchError((error: unknown) => {
      this.cleanupFailures.update(failures => [
        ...failures.filter(failure => failure.jobId !== jobId || failure.phase !== phase), { phase, error, jobId },
      ]);
      return throwError(() => error);
    }));
  }

  private execute(context: DispositionContext, includeArchived: boolean): Observable<EventCoreListRow[]> {
    this.error.set(null);
    this.errorPhase.set(null);
    const receipt = this.result();
    this.phase.set(receipt ? 'readback' : 'apply');
    const write = receipt ? of(receipt) : defer(() => {
      this.assertActor(context.actorId);
      return this.admin.applyCoreDisposition(context.command, context.preview);
    }).pipe(
      catchError((error: unknown) => this.writerFailure(error, context)),
      tap(result => this.result.set(result)),
    );
    return this.run(write.pipe(switchMap(result => {
      this.phase.set('readback');
      this.assertActor(context.actorId);
      return readAdminEventCoreDisposition(this.admin, result, includeArchived);
    }), map(rows => {
      this.assertActor(context.actorId);
      this.pending.set(null);
      this.verified.set(true);
      return rows;
    })));
  }

  private writerFailure(error: unknown, context: DispositionContext): Observable<never> {
    // Only a definite server refusal permits discarding the command. A transport/decoder failure keeps its exact tuple.
    if (isDefiniteEventAdminRpcRejection(error)) {
      this.pending.set(null);
      this.preview.set(null);
      this.previewActorId.set(null);
      if (error.code === '40001' || error.code === '23514') {
        this.phase.set('preview');
        return defer(() => {
          this.assertActor(context.actorId);
          return this.admin.previewCoreDisposition(context.command.coreIds);
        }).pipe(tap(preview => {
          this.assertActor(context.actorId);
          this.previewActorId.set(context.actorId);
          this.preview.set(preview);
        }), switchMap(() => {
          this.phase.set('apply');
          return throwError(() => error);
        }));
      }
    }
    return throwError(() => error);
  }

  private run<T>(request: Observable<T>): Observable<T> {
    return request.pipe(timeout({ first: 30_000 }), catchError((error: unknown) => {
      this.error.set(error);
      const phase = this.phase();
      if (phase !== 'idle') this.errorPhase.set(phase);
      return throwError(() => error);
    }), finalize(() => this.phase.set('idle')));
  }

  private allowed(): boolean {
    return this.platform.isBrowser && this.auth.isReady() && this.auth.hasRole('admin');
  }

  private assertActor(actorId: string): void {
    assertEdgeContract(this.allowed() && this.auth.userId() === actorId,
      'disposition.actor', 'the same ready, authorized administrator before and after each operation');
  }
}
