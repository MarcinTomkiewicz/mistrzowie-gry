import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, defer, EMPTY, finalize, forkJoin, map, Observable, of, switchMap, tap, throwError } from 'rxjs';

import type { IEventCoreDetail, IEventCoreSavePayload } from '../../../../core/interfaces/i-event-admin';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { ImageStorage } from '../../../../core/services/image-storage/image-storage';
import { Storage } from '../../../../core/services/storage/storage';
import type { FileUploadImageChange } from '../../../../core/types/file-upload';
import { RpcError } from '../../../../core/types/rpc-error';
import { assertEdgeContract } from '../../../../core/utils/edge-contract';

type CoverCommand = {
  core: IEventCoreDetail;
  path: string | null;
} & ({ state: 'uncertain' | 'saved' } | {
  state: 'cleanup';
  cleanupPath: string | null;
  readback: IEventCoreDetail | null;
});
type CleanupCommand = Extract<CoverCommand, { state: 'cleanup' }>;

@Injectable()
export class EventCoreCoverController {
  private readonly admin = inject(EventAdmin);
  private readonly images = inject(ImageStorage);
  private readonly storage = inject(Storage);
  private readonly command = signal<CoverCommand | null>(null);
  private readonly reconciliationCoreId = signal<string | null>(null);
  private file: File | null = null;
  readonly removing = signal(false);
  readonly dirty = signal(false);
  readonly isBusy = signal(false);
  readonly state = computed(() => this.command()?.state ?? 'idle');
  readonly error = signal<unknown | null>(null);
  readonly conflict = signal(false);
  readonly abandoned = signal<'readback' | 'cleanup' | null>(null);
  readonly currentCore = signal<IEventCoreDetail | null>(null);
  readonly locked = computed(() => this.isBusy() || this.state() !== 'idle');
  readonly needsReconciliation = computed(() => this.reconciliationCoreId() !== null);
  readonly ready = computed(() => !this.locked() && !this.needsReconciliation());
  readonly canAbandon = computed(() => !this.isBusy() && this.error() !== null &&
    this.command() !== null);

  reset(): void {
    this.releaseCommand();
    this.isBusy.set(false);
    this.error.set(null);
    this.conflict.set(false);
    this.abandoned.set(null);
    this.currentCore.set(null);
    this.reconciliationCoreId.set(null);
  }

  abandon(): boolean {
    const command = this.command();
    if (!this.canAbandon() || !command) return false;
    this.reconciliationCoreId.set(command.core.id);
    this.abandoned.set(command.state === 'cleanup' ? 'cleanup' : 'readback');
    this.releaseCommand();
    this.currentCore.set(null);
    this.error.set(null);
    return true;
  }

  reconcile(core: IEventCoreDetail): void {
    assertEdgeContract(!this.locked() && (!this.needsReconciliation() || this.reconciliationCoreId() === core.id),
      'coreCover', 'a refreshed Core for this completed operation');
    this.currentCore.set(core);
    this.reconciliationCoreId.set(null);
    this.abandoned.set(null);
    this.conflict.set(false);
    this.error.set(null);
  }

  select(change: FileUploadImageChange, core: IEventCoreDetail): void {
    if (!this.ready()) return;
    this.file = change.kind === 'select' ? change.file : null;
    this.removing.set(change.kind === 'clear' && core.coverImagePath !== null);
    this.dirty.set(this.file !== null || this.removing());
    this.error.set(null);
    this.conflict.set(false);
    this.abandoned.set(null);
  }

  save(core: IEventCoreDetail): Observable<IEventCoreDetail | null> {
    return defer(() => {
      const pending = this.command();
      if (this.isBusy() || this.needsReconciliation() || (!this.dirty() && !pending)) return EMPTY;
      assertEdgeContract(!pending || pending.core.id === core.id, 'coreCover', 'the original Core');
      this.isBusy.set(true);
      this.error.set(null);
      this.currentCore.set(null);
      const operation = pending
        ? pending.state === 'cleanup' ? this.cleanup(pending) : this.readback(pending)
        : this.prepare(core).pipe(switchMap(command => this.write(command)));
      return operation.pipe(
        tap({ error: error => this.error.set(error) }),
        finalize(() => this.isBusy.set(false)),
      );
    });
  }

  private prepare(previous: IEventCoreDetail): Observable<CoverCommand> {
    return this.admin.getCoreDetail(previous.id).pipe(switchMap(core => {
      assertEdgeContract(core !== null && core.id === previous.id &&
        (typeof core.coverImagePath === 'string' || core.coverImagePath === null), 'coreCover', 'a saved Core');
      if (core.updatedAt !== previous.updatedAt || core.coverImagePath !== previous.coverImagePath) {
        this.currentCore.set(core);
        this.conflict.set(true);
        throw new Error('[CORE_COVER] Core changed before upload.');
      }
      this.conflict.set(false);
      const path: Observable<string | null> = this.file ? this.images.transcodeAndUpload(this.file, {
        bucket: 'images', folder: `content/event-cores/${core.id}`, usePublicUrl: false, upsert: false,
      }) : of(null);
      return path.pipe(map(path => {
        const command: CoverCommand = { core, path, state: 'uncertain' };
        this.command.set(command);
        return command;
      }));
    }));
  }

  private write(command: CoverCommand): Observable<IEventCoreDetail | null> {
    return this.admin.getCoreDetail(command.core.id).pipe(switchMap(core => {
      assertEdgeContract(core !== null && core.id === command.core.id && core.key === command.core.key,
        'coreCover', 'the current Core before saving its cover');
      if (core.updatedAt !== command.core.updatedAt || core.coverImagePath !== command.core.coverImagePath) {
        this.conflict.set(true);
        this.currentCore.set(core);
        return this.beginCleanup(command, command.path, core);
      }
      const payload: IEventCoreSavePayload = {
        id: core.id, key: core.key, name: core.name,
        shortDescription: core.shortDescription, longDescription: core.longDescription,
        isActive: core.isActive, hasPublicPage: core.hasPublicPage, displayOrder: core.displayOrder,
        coverImagePath: command.path,
      };
      return this.admin.saveCore(payload).pipe(
        tap(() => this.command.set({ core, path: command.path, state: 'saved' })),
        catchError((error: unknown) => {
          if (!(error instanceof RpcError) || !['42501', '22023', '22P02', '23503', '23505', '23514', '40001', 'P0002'].includes(error.code)) {
            return throwError(() => error);
          }
          return this.beginCleanup(command, command.path, null).pipe(switchMap(() => throwError(() => error)));
        }),
        switchMap(() => this.readback({ core, path: command.path, state: 'saved' })),
      );
    }));
  }

  private readback(command: CoverCommand): Observable<IEventCoreDetail | null> {
    return this.admin.getCoreDetail(command.core.id).pipe(switchMap(core => {
      assertEdgeContract(core !== null && core.id === command.core.id && core.key === command.core.key &&
        (typeof core.coverImagePath === 'string' || core.coverImagePath === null), 'coreCover', 'an authoritative Core readback');
      this.currentCore.set(core);
      if (core.coverImagePath !== command.path) {
        if (command.state === 'saved') {
          this.conflict.set(true);
          return this.beginCleanup(command, command.path, core);
        }
        // An earlier path in a GET cannot prove that the pending write will not commit later.
        throw new Error('[CORE_COVER] Requested cover has not been confirmed yet.');
      }
      this.conflict.set(!this.sameMetadata(core, command.core));
      return this.beginCleanup(command, command.core.coverImagePath, core);
    }));
  }

  private beginCleanup(command: CoverCommand, cleanupPath: string | null, readback: IEventCoreDetail | null): Observable<IEventCoreDetail | null> {
    const cleanup: CleanupCommand = { core: command.core, path: command.path, state: 'cleanup', cleanupPath, readback };
    this.command.set(cleanup);
    return this.cleanup(cleanup);
  }

  private cleanup(command: CleanupCommand): Observable<IEventCoreDetail | null> {
    return defer(() => this.removeUnused(command.core.id, command.cleanupPath)).pipe(map(() => {
      const core = this.currentCore() ?? command.readback;
      if (command.readback) {
        this.conflict.set(this.conflict() || !core || core.coverImagePath !== command.path || !this.sameMetadata(core, command.core));
        this.releaseCommand();
      } else {
        this.command.set(null);
      }
      return command.readback && !this.conflict() ? core : null;
    }));
  }

  private releaseCommand(): void {
    this.command.set(null);
    this.file = null;
    this.removing.set(false);
    this.dirty.set(false);
  }

  private sameMetadata(core: IEventCoreDetail, previous: IEventCoreDetail): boolean {
    return core.key === previous.key && core.name === previous.name && core.shortDescription === previous.shortDescription &&
      core.longDescription === previous.longDescription && core.isActive === previous.isActive &&
      core.hasPublicPage === previous.hasPublicPage && core.displayOrder === previous.displayOrder;
  }

  private removeUnused(coreId: string, path: string | null): Observable<void> {
    if (!path) return of(undefined);
    const prefix = `content/event-cores/${coreId}/`;
    assertEdgeContract(path.startsWith(prefix) && /^[a-z0-9][a-z0-9._-]{0,179}\.(avif|webp|png|jpe?g)$/.test(path.slice(prefix.length)),
      'coreCover', 'an image owned by this Core');
    // Core and Edition writers enforce distinct owner prefixes. Check this Core's remaining references before deletion.
    return this.admin.getCoreDetail(coreId).pipe(switchMap(core => {
      assertEdgeContract(core !== null && core.id === coreId, 'coreCover', 'the current Core before cleanup');
      this.currentCore.set(core);
      if (core.coverImagePath === path) return of(undefined);
      return forkJoin({
        editions: core.editions.length ? forkJoin(core.editions.map(row => this.admin.getEditionDetail(row.id))) : of([]),
        policy: this.admin.getEffectivePolicy(coreId),
      }).pipe(switchMap(({ editions, policy }) => {
        assertEdgeContract(editions.every((edition, index) => edition !== null && edition.id === core.editions[index].id &&
          edition.eventCoreId === coreId) && policy.coreId === coreId, 'coreCover', 'all owned Edition and policy references');
        const shared = editions.some(edition => edition?.coverImagePath === path) || policy.global.coverImagePath === path ||
          policy.editions.some(edition => edition.localValues.coverImagePath === path || edition.effective.coverImagePath === path);
        return shared ? of(undefined) : this.storage.removeFile(path, 'images');
      }));
    }));
  }
}
