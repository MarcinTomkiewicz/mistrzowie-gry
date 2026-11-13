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
import { assertPolicyPreview, assertPolicyRead, EventGlobalPolicyError, type GlobalPolicyCommand,
  type GlobalPolicyIssue, matchesPolicySave, policyBaselineDifferences, samePolicyBaseline } from './event-global-policy-state';

@Injectable()
export class EventGlobalPolicyFacade {
  private readonly admin = inject(EventAdmin);
  private readonly core = signal<IEventCoreDetail | null>(null);
  private readonly command = signal<GlobalPolicyCommand | null>(null);
  private readonly baseline = signal<AdminEventPolicyDraft | null>(null);
  private saveContractError: unknown | null = null;
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
    this.formEvents();
    const document = this.document();
    const source = this.sourceDocument();
    return this.form.dirty && (!document || !source || !samePolicyDocument(document, source));
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
  readonly canSave = computed(() => this.canPreview() && this.command() !== null && this.preview()?.valid === true &&
    this.preview()?.status === 'draft_ready');

  constructor() {
    effect(() => this.syncControls());
    this.form.controls.price.controls.amount.valueChanges.pipe(takeUntilDestroyed()).subscribe(amount => {
      if (amount === null) this.form.controls.price.controls.basis.setValue(null, { emitEvent: false });
      this.form.updateValueAndValidity({ emitEvent: false });
      this.syncControls();
    });
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => { this.invalidatePreview(); this.syncControls(); });
  }

  reset(): void {
    this.baseline.set(null);
    this.saveContractError = null;
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

  load(core: IEventCoreDetail): Observable<AdminEventPolicyDraft> {
    return defer(() => {
      if (this.blocked() || this.locked()) return EMPTY;
      this.core.set(core);
      return this.run('read', this.readCurrent().pipe(tap(read => this.populate(read))));
    });
  }

  acceptCalendarReadback(): Observable<AdminEventPolicyDraft> {
    return defer(() => {
      const before = this.baseline();
      return this.run('read', this.readCurrent().pipe(tap(read => {
        assertEdgeContract(before !== null && !read.baselineChanged && before.coreId === read.coreId &&
          before.revision === read.revision && before.hasDraft === read.hasDraft &&
          samePolicyDocument(mapEventPolicyDocument(before), mapEventPolicyDocument(read)),
        'globalPolicy.calendarReadback', 'unchanged policy data after the confirmed calendar saves');
        this.baseline.set(read);
      })));
    });
  }

  previewChanges(): Observable<AdminEventPolicyPreview> {
    return defer(() => {
      this.validationAttempted.set(true);
      this.form.markAllAsTouched();
      if (!this.canPreview() || this.form.invalid) return EMPTY;
      const baseline = this.baseline();
      assertEdgeContract(baseline !== null, 'globalPolicy', 'the authoritative edit baseline');
      const source = mapEventPolicyDocument(baseline);
      const command: GlobalPolicyCommand = { coreId: baseline.coreId, baseline,
        document: mapEventPolicyRules(this.form.controls.rules, mapEventPolicyPrice(this.form.controls.price, source)),
        confirmedRevision: null };
      this.invalidatePreview();
      return this.run('preview', this.readCurrent().pipe(switchMap(read => {
        if (read.baselineChanged || !samePolicyBaseline(baseline, read)) {
          throw new EventGlobalPolicyError(read.baselineChanged ? 'baselineChanged' : 'conflict', policyBaselineDifferences(baseline, read));
        }
        const fields = policyDocumentDifferences(source, mapEventPolicyDocument(read));
        if (fields.length) throw new EventGlobalPolicyError('documentMismatch', fields);
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
    this.saveContractError = null;
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
    const { price, rules } = this.form.controls;
    setControlEnabled(price, enabled);
    setControlEnabled(price.controls.basis, enabled && price.controls.amount.value !== null);
    setControlEnabled(rules, enabled);
    for (const row of rules.controls.cityOverrides.controls) {
      row.controls.editionId.disable({ emitEvent: false });
      for (const group of [row.controls.signup, row.controls.sessionCapacityCeiling, row.controls.wholeEventCapacity]) {
        setControlEnabled(group.controls.value, enabled && group.controls.enabled.value);
      }
    }
    rules.updateValueAndValidity({ emitEvent: false });
  }

  private run<T>(operation: 'read' | 'preview' | 'save', request: Observable<T>): Observable<T> {
    this.operation.set(operation);
    this.error.set(this.saveContractError);
    this.saved.set(false);
    return request.pipe(tap({ error: error => {
      this.error.set(error);
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
