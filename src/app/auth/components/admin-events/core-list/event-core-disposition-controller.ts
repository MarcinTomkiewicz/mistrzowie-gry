import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, defer, EMPTY, finalize, map, Observable, of, switchMap, tap, throwError, timeout } from 'rxjs';

import type { AdminEventCoreDispositionPreview, AdminEventCoreDispositionResult,
  EventCoreDispositionCommand } from '../../../../core/interfaces/i-event-admin';
import { readAdminEventCoreDisposition } from '../../../../core/reads/events/admin-event-core-disposition-read';
import { Auth } from '../../../../core/services/auth/auth';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { Platform } from '../../../../core/services/platform/platform';
import { assertEdgeContract } from '../../../../core/utils/edge-contract';
import type { EventCoreListRow } from '../../../../core/utils/event-admin-list';
import { isDefiniteEventAdminRpcRejection } from '../event-admin-errors';

type DispositionContext = {
  command: EventCoreDispositionCommand;
  preview: AdminEventCoreDispositionPreview;
  actorId: string;
};

@Injectable()
export class EventCoreDispositionController {
  private readonly admin = inject(EventAdmin);
  private readonly auth = inject(Auth);
  private readonly platform = inject(Platform);
  private readonly pending = signal<DispositionContext | null>(null);
  readonly phase = signal<'idle' | 'preview' | 'apply' | 'readback'>('idle');
  readonly preview = signal<AdminEventCoreDispositionPreview | null>(null);
  readonly result = signal<AdminEventCoreDispositionResult | null>(null);
  readonly verified = signal(false);
  readonly error = signal<unknown | null>(null);
  readonly busy = computed(() => this.phase() !== 'idle');
  readonly needsReadback = computed(() => this.pending() !== null);
  readonly locked = computed(() => this.busy() || this.needsReadback());
  readonly canApply = computed(() => this.allowed() && !this.locked() && !this.verified() &&
    this.result() === null && this.preview()?.status === 'ready');

  invalidate(): void {
    if (this.locked()) return;
    this.preview.set(null);
    this.result.set(null);
    this.verified.set(false);
    this.error.set(null);
  }

  prepare(coreIds: readonly string[]): Observable<AdminEventCoreDispositionPreview> {
    return defer(() => {
      if (!this.allowed() || this.locked()) return EMPTY;
      this.invalidate();
      this.phase.set('preview');
      return this.run(this.admin.previewCoreDisposition([...coreIds]).pipe(tap(preview => this.preview.set(preview))));
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
      if (!context || this.busy() || !this.allowed() || context.actorId !== this.auth.userId()) return EMPTY;
      return this.execute(context, includeArchived);
    });
  }

  private execute(context: DispositionContext, includeArchived: boolean): Observable<EventCoreListRow[]> {
    this.error.set(null);
    const receipt = this.result();
    this.phase.set(receipt ? 'readback' : 'apply');
    const write = receipt ? of(receipt) : this.admin.applyCoreDisposition(context.command, context.preview).pipe(
      catchError((error: unknown) => this.writerFailure(error, context)),
      tap(result => this.result.set(result)),
    );
    return this.run(write.pipe(switchMap(result => {
      this.phase.set('readback');
      return readAdminEventCoreDisposition(this.admin, result, includeArchived);
    }), map(rows => {
      assertEdgeContract(context.actorId === this.auth.userId() && this.allowed(),
        'disposition.actor', 'the same authorized administrator completing the command');
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
      if (error.code === '40001' || error.code === '23514') {
        this.phase.set('preview');
        return this.admin.previewCoreDisposition(context.command.coreIds).pipe(
          tap(preview => this.preview.set(preview)),
          switchMap(() => throwError(() => error)),
        );
      }
    }
    return throwError(() => error);
  }

  private run<T>(request: Observable<T>): Observable<T> {
    return request.pipe(timeout({ first: 30_000 }), catchError((error: unknown) => {
      this.error.set(error);
      return throwError(() => error);
    }), finalize(() => this.phase.set('idle')));
  }

  private allowed(): boolean {
    return this.platform.isBrowser && this.auth.hasRole('admin');
  }
}
