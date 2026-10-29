import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { catchError, defer, EMPTY, finalize, forkJoin, map, Observable, of, switchMap, tap, throwError } from 'rxjs';

import { assertPolicyDocument, createEventPolicyPriceForm, mapEventPolicyDocument,
  mapEventPolicyPrice, samePolicyDocument } from '../../../../core/factories/event-policy-form.factory';
import type { AdminEventPolicyDraft, AdminEventPolicyPreview } from '../../../../core/interfaces/i-admin-event-policy';
import type { IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { RpcError } from '../../../../core/types/rpc-error';
import { assertEdgeContract } from '../../../../core/utils/edge-contract';
import { setControlEnabled } from '../../../../core/utils/form-controls';
import { assertPolicyPreview, assertPolicyRead, EventGlobalPriceError, type GlobalPriceCommand,
  type GlobalPriceIssue, matchesPolicySave, samePolicyBaseline } from './event-global-price-state';

@Injectable()
export class EventGlobalPriceController {
  private readonly admin = inject(EventAdmin);
  private readonly core = signal<IEventCoreDetail | null>(null);
  private readonly command = signal<GlobalPriceCommand | null>(null);
  private baseline: AdminEventPolicyDraft | null = null;
  private saveContractError: unknown | null = null;
  private readonly operation = signal<'read' | 'preview' | 'save' | null>(null);
  readonly draft = signal<AdminEventPolicyDraft | null>(null);
  readonly blocked = signal(false);
  readonly issue = signal<GlobalPriceIssue | null>(null);
  readonly readbackPending = signal(false);
  readonly error = signal<unknown | null>(null);
  readonly preview = signal<AdminEventPolicyPreview | null>(null);
  readonly saved = signal(false);
  readonly validationAttempted = signal(false);
  readonly form = createEventPolicyPriceForm();
  private readonly formEvents = toSignal(this.form.events);
  readonly dirty = computed(() => { this.formEvents(); return this.form.dirty; });
  readonly isBusy = computed(() => this.operation() !== null);
  readonly conflicted = computed(() => this.issue() !== null);
  readonly locked = computed(() => this.isBusy() || this.dirty() || this.issue() === 'conflict' || this.readbackPending());
  readonly canEdit = computed(() => {
    const core = this.core();
    return !this.blocked() && core !== null && !core.isActive && !core.hasPublicPage &&
      this.draft()?.canonicalBaseline.lifecycle === 'global' && !this.draft()?.baselineChanged;
  });
  readonly canPreview = computed(() => this.canEdit() && this.dirty() && !this.isBusy() && !this.conflicted() && !this.readbackPending());
  readonly canSave = computed(() => this.canPreview() && this.command() !== null && this.preview()?.valid === true &&
    this.preview()?.status === 'draft_ready');
  readonly canDiscard = computed(() => !this.blocked() && !this.isBusy() && !this.readbackPending() && (this.dirty() || this.conflicted()));

  constructor() {
    effect(() => this.syncControls());
    this.form.controls.amount.valueChanges.pipe(takeUntilDestroyed()).subscribe(amount => {
      if (amount === null) this.form.controls.basis.setValue(null, { emitEvent: false });
      this.form.updateValueAndValidity({ emitEvent: false });
      this.syncControls();
    });
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.invalidatePreview());
  }

  reset(): void {
    this.baseline = null;
    this.saveContractError = null;
    this.command.set(null);
    this.operation.set(null);
    this.core.set(null);
    this.draft.set(null);
    this.issue.set(null);
    this.readbackPending.set(false);
    this.error.set(null);
    this.preview.set(null);
    this.saved.set(false);
    this.validationAttempted.set(false);
    this.form.reset();
  }

  load(core: IEventCoreDetail): Observable<AdminEventPolicyDraft> {
    return defer(() => {
      if (this.blocked() || this.locked()) return EMPTY;
      this.core.set(core);
      return this.run('read', this.readCurrent().pipe(tap(read => this.populate(read))));
    });
  }

  previewChanges(): Observable<AdminEventPolicyPreview> {
    return defer(() => {
      this.validationAttempted.set(true);
      this.form.markAllAsTouched();
      if (!this.canPreview() || this.form.invalid) return EMPTY;
      const baseline = this.baseline;
      assertEdgeContract(baseline !== null, 'globalPrice', 'the authoritative edit baseline');
      const command: GlobalPriceCommand = { coreId: baseline.coreId, baseline,
        document: mapEventPolicyPrice(this.form, mapEventPolicyDocument(baseline)), confirmedRevision: null };
      this.invalidatePreview();
      return this.run('preview', this.readCurrent().pipe(switchMap(read => {
        if (read.baselineChanged || !samePolicyBaseline(baseline, read)) {
          throw new EventGlobalPriceError(read.baselineChanged ? 'baselineChanged' : 'conflict');
        }
        if (!this.canEdit()) return EMPTY;
        return this.admin.previewPolicyChange(command.coreId, command.document).pipe(tap(preview => {
          assertPolicyPreview(preview, command);
          this.preview.set(preview);
          if (preview.valid && preview.status === 'draft_ready') this.command.set(command);
        }));
      })));
    });
  }

  save(): Observable<AdminEventPolicyDraft> {
    return defer(() => {
      const command = this.command();
      if (!command || !this.canSave()) return EMPTY;
      this.readbackPending.set(true);
      this.preview.set(null);
      const write = this.admin.savePolicyDraft(command.coreId, command.baseline.revision, command.document).pipe(map(result => {
        try {
          assertEdgeContract(Number.isInteger(result.revision) && result.revision >= 0 &&
            ((result.saved === true && result.status === 'draft_saved') || (result.saved === false && result.status === 'invalid')),
          'policySave', 'an explicit saved or refused draft result');
          assertPolicyPreview(result.preview, command);
          if (result.saved) {
            assertPolicyDocument(result.document, command.baseline.canonicalBaseline.editions.map(row => row.editionId));
            assertEdgeContract(result.coreId === command.coreId && result.appliedToPublic === false &&
              result.revision === command.baseline.revision + 1 && result.baselineFingerprint === command.baseline.baselineFingerprint &&
              result.preview.valid && result.preview.status === 'draft_ready' && samePolicyDocument(result.document, command.document),
            'policySave', 'the entire submitted document and its expected draft revision and fingerprint');
          } else {
            assertEdgeContract(result.preview.valid === false, 'policySave', 'a refused preview when saved is false');
          }
        } catch (error: unknown) {
          this.saveContractError = error;
          this.error.set(error);
          this.issue.set('conflict');
          return null;
        }
        if (!result.saved) {
          this.readbackPending.set(false);
          this.command.set(null);
          this.preview.set(result.preview);
        } else command.confirmedRevision = result.revision;
        return result;
      }), catchError((error: unknown) => {
        this.error.set(error);
        if (error instanceof RpcError && ['40001', '42501', '22023', '22P02', '22003', '23514', 'P0002'].includes(error.code)) {
          this.readbackPending.set(false);
          this.command.set(null);
          if (error.code === '40001') this.issue.set('conflict');
          return throwError(() => error);
        }
        return of(null);
      }));
      return this.run('save', write.pipe(switchMap(result => result?.saved === false ? EMPTY
        : this.readCurrent().pipe(tap(read => this.reconcile(read, command))))));
    });
  }

  refresh(discard = false): Observable<AdminEventPolicyDraft> {
    return defer(() => {
      if (this.isBusy() || this.blocked() || (discard && !this.canDiscard())) return EMPTY;
      if (!this.readbackPending()) this.invalidatePreview();
      return this.run('read', this.readCurrent().pipe(tap(read => {
        const command = this.command();
        if (this.readbackPending() && command) this.reconcile(read, command);
        else if (discard || !this.dirty()) this.populate(read);
        else if (read.baselineChanged || !this.baseline || !samePolicyBaseline(this.baseline, read)) {
          this.issue.set(read.baselineChanged ? 'baselineChanged' : 'conflict');
        }
      })));
    });
  }

  private readCurrent(): Observable<AdminEventPolicyDraft> {
    const core = this.core();
    assertEdgeContract(core !== null, 'globalPrice', 'a loaded Core');
    return forkJoin({ core: this.admin.getCoreDetail(core.id), draft: this.admin.getPolicyDraft(core.id) }).pipe(map(result => {
      assertEdgeContract(result.core !== null && result.core.id === core.id, 'globalPrice', 'an authoritative owner Core');
      assertPolicyRead(result.core, result.draft);
      this.core.set(result.core);
      this.draft.set(result.draft);
      return result.draft;
    }));
  }

  private reconcile(read: AdminEventPolicyDraft, command: GlobalPriceCommand): void {
    if (this.saveContractError !== null) {
      this.readbackPending.set(false);
      this.command.set(null);
      this.issue.set('conflict');
      this.form.markAsDirty();
      throw this.saveContractError;
    }
    if (matchesPolicySave(read, command) && this.canEdit()) {
      this.populate(read);
      this.saved.set(true);
    } else if (command.confirmedRevision !== null) {
      this.readbackPending.set(false);
      this.command.set(null);
      this.issue.set(read.baselineChanged ? 'baselineChanged' : 'conflict');
      this.form.markAsDirty();
    }
  }

  private populate(read: AdminEventPolicyDraft): void {
    this.baseline = read;
    this.saveContractError = null;
    this.error.set(null);
    this.command.set(null);
    this.readbackPending.set(false);
    this.preview.set(null);
    this.saved.set(false);
    this.issue.set(read.baselineChanged ? 'baselineChanged' : null);
    this.validationAttempted.set(false);
    this.form.reset(mapEventPolicyDocument(read).global.price);
    this.syncControls();
  }

  private invalidatePreview(): void {
    this.preview.set(null);
    this.saved.set(false);
    if (!this.readbackPending()) this.command.set(null);
  }

  private syncControls(): void {
    const enabled = this.canEdit() && !this.isBusy() && !this.conflicted() && !this.readbackPending();
    setControlEnabled(this.form, enabled);
    setControlEnabled(this.form.controls.basis, enabled && this.form.controls.amount.value !== null);
  }

  private run<T>(operation: 'read' | 'preview' | 'save', request: Observable<T>): Observable<T> {
    this.operation.set(operation);
    this.error.set(this.saveContractError);
    this.saved.set(false);
    return request.pipe(tap({ error: error => {
      this.error.set(error);
      if (!this.readbackPending()) {
        this.invalidatePreview();
        if (error instanceof EventGlobalPriceError) this.issue.set(error.issue);
        else if (error instanceof RpcError && error.code === '40001') this.issue.set('conflict');
      }
    } }), finalize(() => this.operation.set(null)));
  }
}
