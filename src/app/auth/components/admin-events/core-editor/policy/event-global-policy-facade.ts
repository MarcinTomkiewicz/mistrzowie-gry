import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { catchError, defer, EMPTY, finalize, forkJoin, map, Observable, of, switchMap, tap, throwError } from 'rxjs';

import { assertPolicyDocument, createEventPolicyPriceForm, createEventPolicyRulesForm, mapEventPolicyDocument,
  mapEventPolicyPrice, mapEventPolicyRules, policyDocumentDifferences, samePolicyDocument } from '../../../../../core/factories/event-policy-form.factory';
import type { AdminEventPolicyDraft, AdminEventPolicyPreview } from '../../../../../core/interfaces/i-admin-event-policy';
import type { IEventCoreDetail } from '../../../../../core/interfaces/i-event-admin';
import { EventAdmin } from '../../../../../core/services/event-admin/event-admin';
import { RpcError } from '../../../../../core/types/rpc-error';
import { assertEdgeContract } from '../../../../../core/utils/edge-contract';
import { setControlEnabled } from '../../../../../core/utils/form-controls';
import { EventGlobalSaveError } from '../../event-admin-errors';
import { assertPolicyPreview, assertPolicyRead, EventGlobalPolicyError, type GlobalPolicyCommand,
  type GlobalPolicyIssue, matchesPolicySave, policyBaselineDifferences, samePolicyBaseline } from './event-global-policy-state';

@Injectable()
export class EventGlobalPolicyFacade {
  private readonly admin = inject(EventAdmin);
  private readonly core = signal<IEventCoreDetail | null>(null);
  private readonly command = signal<GlobalPolicyCommand | null>(null);
  private readonly baseline = signal<AdminEventPolicyDraft | null>(null);
  private readonly operation = signal<'read' | 'preview' | 'save' | null>(null);
  readonly draft = signal<AdminEventPolicyDraft | null>(null);
  readonly blocked = signal(false);
  readonly issue = signal<GlobalPolicyIssue | null>(null);
  readonly issueFields = signal<readonly string[]>([]);
  readonly readbackPending = signal(false);
  readonly error = signal<unknown | null>(null);
  readonly preview = signal<AdminEventPolicyPreview | null>(null);
  readonly saved = signal(false);
  readonly validationAttempted = signal(false);
  readonly form = new FormGroup({ price: createEventPolicyPriceForm(), rules: createEventPolicyRulesForm() });
  private readonly formEvents = toSignal(this.form.events);
  readonly sourceDocument = computed(() => {
    const baseline = this.baseline();
    return baseline ? mapEventPolicyDocument(baseline) : null;
  });
  readonly document = computed(() => {
    this.formEvents();
    const source = this.sourceDocument();
    if (!source || this.form.invalid) return null;
    return mapEventPolicyRules(this.form.controls.rules,
      mapEventPolicyPrice(this.form.controls.price, source));
  });
  readonly dirty = computed(() => {
    const document = this.document();
    const source = this.sourceDocument();
    return source !== null && (!document || !samePolicyDocument(document, source));
  });
  readonly isBusy = computed(() => this.operation() !== null);
  readonly conflicted = computed(() => this.issue() !== null);
  readonly locked = computed(() => this.isBusy() || this.dirty() || this.issue() === 'conflict' || this.readbackPending());
  readonly canReload = computed(() => this.conflicted() && !this.isBusy() && !this.blocked() && !this.readbackPending());
  readonly canEdit = computed(() => {
    const core = this.core();
    return !this.blocked() && core !== null && !core.isActive && !core.hasPublicPage &&
      this.draft()?.canonicalBaseline.lifecycle === 'global' && !this.draft()?.baselineChanged;
  });
  readonly canPreview = computed(() => this.canEdit() && this.dirty() && !this.isBusy() && !this.conflicted() && !this.readbackPending());
  readonly canSave = computed(() => this.canPreview() && this.command() !== null && this.preview()?.valid === true);

  saveUnavailableError(): EventGlobalSaveError {
    return new EventGlobalSaveError('unavailable', !this.core() || !this.baseline() ? 'notLoaded'
      : this.conflicted() ? 'conflict' : this.readbackPending() ? 'pending' : this.blocked() ? 'blocked'
        : !this.canEdit() ? 'protected' : this.isBusy() ? 'busy' : this.form.invalid ? 'invalid'
          : !this.dirty() ? 'unchanged' : !this.command() || !this.preview() ? 'previewRequired' : 'previewMismatch', {
      canSave: this.canSave(), canPreview: this.canPreview(), isBusy: this.isBusy(), blocked: this.blocked(),
      readbackPending: this.readbackPending(), issue: this.issue(), dirty: this.dirty(), formDirty: this.form.dirty,
      hasCommand: this.command() !== null, expectedRevision: this.command()?.baseline.revision,
      baselineRevision: this.baseline()?.revision, baselineFingerprint: this.baseline()?.baselineFingerprint, preview: this.preview(),
    });
  }

  constructor() {
    effect(() => { this.formEvents(); this.syncControls(); });
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      const price = this.form.controls.price.controls;
      if (price.amount.value === null) price.basis.setValue(null, { emitEvent: false });
      this.form.updateValueAndValidity({ emitEvent: false });
      this.invalidatePreview();
    });
  }

  reset(): void {
    this.baseline.set(null);
    this.command.set(null);
    this.operation.set(null);
    this.core.set(null);
    this.draft.set(null);
    this.issue.set(null);
    this.issueFields.set([]);
    this.readbackPending.set(false);
    this.error.set(null);
    this.preview.set(null);
    this.saved.set(false);
    this.validationAttempted.set(false);
    this.form.setControl('rules', createEventPolicyRulesForm());
    this.form.reset();
  }

  load(core: IEventCoreDetail, saved?: AdminEventPolicyDraft): Observable<AdminEventPolicyDraft> {
    return defer(() => {
      if (this.locked()) return EMPTY;
      this.core.set(core);
      if (saved) {
        assertPolicyRead(core, saved);
        this.draft.set(saved);
        this.populate(saved);
        return of(saved);
      }
      return this.run('read', this.readCurrent().pipe(tap(read => this.populate(read))));
    });
  }

  acceptCalendarReadback(): Observable<AdminEventPolicyDraft> {
    return defer(() => {
      const before = this.baseline();
      return this.run('read', this.readCurrent().pipe(tap(read => {
        assertEdgeContract(before !== null && before.coreId === read.coreId,
          'globalPolicy.calendarReadback', 'the same owner after the confirmed calendar saves');
        const fields = policyBaselineDifferences(before, read).filter(field => field !== 'baselineFingerprint');
        if (read.baselineChanged || fields.length) throw new EventGlobalPolicyError(
          read.baselineChanged ? 'baselineChanged' : 'conflict', read.baselineChanged ? [...fields, 'baselineChanged'] : fields);
        const differences = policyDocumentDifferences(mapEventPolicyDocument(before), mapEventPolicyDocument(read));
        if (differences.length) throw new EventGlobalPolicyError('documentMismatch', differences);
        this.baseline.set(read);
      })));
    });
  }

  previewChanges(): Observable<AdminEventPolicyPreview> {
    return defer(() => {
      if (this.isBusy() || this.readbackPending()) return throwError(() => this.saveUnavailableError());
      this.validationAttempted.set(true);
      this.form.markAllAsTouched();
      this.invalidatePreview();
      const document = this.document();
      if (!this.canPreview() || !document) return throwError(() => this.saveUnavailableError());
      const baseline = this.baseline();
      assertEdgeContract(baseline !== null, 'globalPolicy', 'the authoritative edit baseline');
      const source = mapEventPolicyDocument(baseline);
      const command: GlobalPolicyCommand = { coreId: baseline.coreId, baseline, document, confirmedRevision: null };
      return this.run('preview', this.readCurrent().pipe(switchMap(read => {
        if (read.baselineChanged || !samePolicyBaseline(baseline, read)) {
          throw new EventGlobalPolicyError(read.baselineChanged ? 'baselineChanged' : 'conflict', policyBaselineDifferences(baseline, read));
        }
        const fields = policyDocumentDifferences(source, mapEventPolicyDocument(read));
        if (fields.length) throw new EventGlobalPolicyError('documentMismatch', fields);
        if (!this.canEdit()) return throwError(() => this.saveUnavailableError());
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
      if (!command || !this.canSave()) return throwError(() => this.saveUnavailableError());
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
          this.error.set(error);
          this.issue.set(error instanceof EventGlobalPolicyError ? error.issue : 'contractMismatch');
          this.issueFields.set(error instanceof EventGlobalPolicyError ? error.fields : []);
          return null;
        }
        if (!result.saved) {
          this.readbackPending.set(false);
          this.command.set(null);
          this.preview.set(result.preview);
        } else command.confirmedRevision = result.revision;
        return result;
      }), catchError((error: unknown) => {
        if (error instanceof RpcError && ['40001', '42501', '22023', '22P02', '22003', '23514', 'P0002'].includes(error.code)) {
          this.readbackPending.set(false);
          this.command.set(null);
          if (error.code === '40001') this.issue.set('conflict');
          return throwError(() => error);
        }
        this.error.set(error);
        return of(null);
      }));
      return this.run('save', write.pipe(switchMap(result => result?.saved === false ? throwError(() => new EventGlobalSaveError('writeRejected'))
        : this.readCurrent().pipe(tap(read => this.reconcile(read, command))))));
    });
  }

  refresh(): Observable<AdminEventPolicyDraft> {
    return defer(() => {
      const command = this.command();
      if (this.isBusy() || this.blocked() || !this.readbackPending() || !command) return EMPTY;
      return this.run('read', this.readCurrent().pipe(tap(read => this.reconcile(read, command))));
    });
  }

  reload(): Observable<AdminEventPolicyDraft> {
    return defer(() => this.canReload()
      ? this.run('read', this.readCurrent().pipe(tap(read => this.populate(read)))) : EMPTY);
  }

  private readCurrent(): Observable<AdminEventPolicyDraft> {
    const core = this.core();
    assertEdgeContract(core !== null, 'globalPolicy', 'a loaded Core');
    return forkJoin({ core: this.admin.getCoreDetail(core.id), draft: this.admin.getPolicyDraft(core.id) }).pipe(map(result => {
      assertEdgeContract(result.core !== null && result.core.id === core.id, 'globalPolicy', 'an authoritative owner Core');
      assertPolicyRead(result.core, result.draft);
      this.core.set(result.core);
      this.draft.set(result.draft);
      return result.draft;
    }));
  }

  private reconcile(read: AdminEventPolicyDraft, command: GlobalPolicyCommand): void {
    if (matchesPolicySave(read, command) && this.canEdit()) {
      this.populate(read);
      this.saved.set(true);
    } else {
      this.issue.set(read.baselineChanged ? 'baselineChanged' : 'contractMismatch');
      this.issueFields.set(policyDocumentDifferences(command.document, mapEventPolicyDocument(read)));
      this.form.markAsDirty();
      assertEdgeContract(false, 'globalPolicy.readback', 'the exact pending policy document and revision in canonical readback');
    }
  }

  private populate(read: AdminEventPolicyDraft): void {
    this.baseline.set(read);
    this.error.set(null);
    this.command.set(null);
    this.readbackPending.set(false);
    this.preview.set(null);
    this.saved.set(false);
    this.issue.set(read.baselineChanged ? 'baselineChanged' : null);
    this.issueFields.set([]);
    this.validationAttempted.set(false);
    const document = mapEventPolicyDocument(read);
    this.form.controls.price.reset(document.global.price);
    this.form.setControl('rules', createEventPolicyRulesForm(document));
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private invalidatePreview(): void {
    this.preview.set(null);
    this.saved.set(false);
    if (!this.readbackPending()) this.command.set(null);
  }

  private syncControls(): void {
    const enabled = this.canEdit() && !this.isBusy() && !this.conflicted() && !this.readbackPending();
    setControlEnabled(this.form, enabled);
    // The root already disables every descendant; repeating child disables recalculates ancestor pristine flags.
    if (!enabled) return;
    const { price, rules } = this.form.controls;
    setControlEnabled(price.controls.basis, price.controls.amount.value !== null);
    for (const row of rules.controls.cityOverrides.controls) {
      setControlEnabled(row.controls.editionId, false);
      for (const group of [row.controls.signup, row.controls.sessionCapacityCeiling, row.controls.wholeEventCapacity]) {
        setControlEnabled(group.controls.value, group.controls.enabled.value);
      }
    }
  }

  private run<T>(operation: 'read' | 'preview' | 'save', request: Observable<T>): Observable<T> {
    this.operation.set(operation);
    if (!this.readbackPending()) this.error.set(null);
    this.saved.set(false);
    return request.pipe(tap({ error: error => {
      this.error.set(error);
      if (error instanceof EventGlobalSaveError) return;
      if (!this.readbackPending()) {
        this.invalidatePreview();
        if (error instanceof EventGlobalPolicyError) {
          this.issue.set(error.issue);
          this.issueFields.set(error.fields);
        } else if (error instanceof RpcError && error.code === '40001') {
          this.issue.set('conflict');
          this.issueFields.set([]);
        }
      }
    } }), finalize(() => this.operation.set(null)));
  }
}
