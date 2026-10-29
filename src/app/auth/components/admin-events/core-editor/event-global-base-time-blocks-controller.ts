import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { catchError, defer, EMPTY, finalize, forkJoin, map, Observable, of, switchMap, tap, throwError } from 'rxjs';

import { createEventGlobalTimeBlocksForm, mapEventGlobalTimeBlocks } from '../../../../core/factories/event-global-time-block-form.factory';
import type { AdminGlobalBaseTimeBlocksPreview, AdminGlobalCalendarResult } from '../../../../core/interfaces/i-admin-global-event';
import type { IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { RpcError } from '../../../../core/types/rpc-error';
import { assertEdgeContract } from '../../../../core/utils/edge-contract';
import { assertBaseCalendar, assertBasePreview, assertBaseSave, canEditBaseTimeBlocks,
  type GlobalBaseTimeBlocksCommand, matchesBaseTimeBlocks } from './event-global-base-time-blocks-state';

@Injectable()
export class EventGlobalBaseTimeBlocksController {
  private readonly admin = inject(EventAdmin);
  private readonly core = signal<IEventCoreDetail | null>(null);
  private readonly command = signal<GlobalBaseTimeBlocksCommand | null>(null);
  private baseline: AdminGlobalCalendarResult | null = null;
  private readonly operation = signal<'preview' | 'save' | 'read' | null>(null);
  readonly calendar = signal<AdminGlobalCalendarResult | null>(null);
  readonly blocked = signal(false);
  readonly conflicted = signal(false);
  readonly readbackPending = signal(false);
  readonly validationAttempted = signal(false);
  readonly error = signal<unknown | null>(null);
  readonly preview = signal<AdminGlobalBaseTimeBlocksPreview | null>(null);
  readonly result = signal<'saved' | 'unchanged' | null>(null);
  readonly form = new FormGroup({ timeBlocks: createEventGlobalTimeBlocksForm([], 'saved-base') });
  private readonly formEvents = toSignal(this.form.events);
  readonly dirty = computed(() => { this.formEvents(); return this.form.dirty; });
  readonly isBusy = computed(() => this.operation() !== null);
  readonly locked = computed(() => this.isBusy() || this.dirty() || this.conflicted() || this.readbackPending());
  readonly canEdit = computed(() => {
    const core = this.core();
    const calendar = this.calendar();
    return !this.blocked() && core !== null && calendar !== null && canEditBaseTimeBlocks(core, calendar);
  });
  readonly canPreview = computed(() => this.canEdit() && !this.isBusy() && this.dirty() && !this.conflicted() && !this.readbackPending());
  readonly canSave = computed(() => this.canPreview() && this.command() !== null && this.preview()?.valid === true &&
    this.preview()?.status === 'preview_ready' && this.preview()?.changed !== false);
  readonly canDiscard = computed(() => !this.blocked() && !this.isBusy() && !this.readbackPending() && (this.dirty() || this.conflicted()));

  constructor() {
    effect(() => {
      if (this.canEdit() && !this.isBusy() && !this.readbackPending() && !this.conflicted()) this.form.enable({ emitEvent: false });
      else this.form.disable({ emitEvent: false });
    });
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.invalidatePreview());
  }

  reset(): void {
    this.baseline = null;
    this.command.set(null);
    this.operation.set(null);
    this.core.set(null);
    this.calendar.set(null);
    this.conflicted.set(false);
    this.readbackPending.set(false);
    this.validationAttempted.set(false);
    this.preview.set(null);
    this.error.set(null);
    this.result.set(null);
    this.form.setControl('timeBlocks', createEventGlobalTimeBlocksForm([], 'saved-base'));
    this.form.markAsPristine();
  }

  load(core: IEventCoreDetail, calendar: AdminGlobalCalendarResult): void {
    assertBaseCalendar(core, calendar);
    if (this.locked()) return;
    this.core.set(core);
    this.calendar.set(calendar);
    this.populate(calendar);
    this.error.set(null);
  }

  previewChanges(): Observable<AdminGlobalBaseTimeBlocksPreview> {
    return defer(() => {
      this.validationAttempted.set(true);
      this.form.markAllAsTouched();
      if (!this.canPreview() || this.form.invalid) return EMPTY;
      const baseline = this.baseline;
      assertEdgeContract(baseline !== null, 'globalBaseTimeBlocks', 'the edit baseline');
      const timeBlocks = mapEventGlobalTimeBlocks(this.form.controls.timeBlocks, 'saved-base');
      assertEdgeContract(timeBlocks.length === baseline.timeBlocks.length &&
        new Set(timeBlocks.map(block => block.position)).size === timeBlocks.length && timeBlocks.every(block =>
        baseline.timeBlocks.some(row => row.position === block.position)), 'globalBaseTimeBlocks', 'unchanged block positions and count');
      const command: GlobalBaseTimeBlocksCommand = { coreId: baseline.coreId,
        expectedCalendarRevision: baseline.calendarRevision, timeBlocks, baseline, outcome: null };
      this.invalidatePreview();
      return this.run('preview', this.readCurrent().pipe(switchMap(calendar => {
        if (calendar.calendarRevision !== baseline.calendarRevision || calendar.draftRevision !== baseline.draftRevision) {
          this.conflict();
          return EMPTY;
        }
        if (!this.canEdit()) return EMPTY;
        return this.admin.previewGlobalBaseTimeBlocks(command).pipe(tap(preview => {
          assertBasePreview(preview, command);
          this.preview.set(preview);
          if (preview.valid && preview.status === 'preview_ready') this.command.set(command);
        }));
      })));
    });
  }

  save(): Observable<AdminGlobalCalendarResult> {
    return defer(() => {
      const command = this.command();
      if (!command || !this.canSave()) return EMPTY;
      this.readbackPending.set(true);
      this.preview.set(null);
      const write = this.admin.saveGlobalBaseTimeBlocks(command).pipe(tap(saved => {
        assertBaseSave(saved, command);
        if (!saved.saved) {
          this.readbackPending.set(false);
          this.command.set(null);
          this.preview.set(saved.preview);
        } else command.outcome = saved.status;
      }), catchError((error: unknown) => {
        this.error.set(error);
        if (error instanceof RpcError && ['40001', '42501', '22023', '22P02', '23514', 'P0002'].includes(error.code)) {
          this.readbackPending.set(false);
          this.command.set(null);
          if (error.code === '40001') this.conflict();
          return throwError(() => error);
        }
        return of(null);
      }));
      return this.run('save', write.pipe(switchMap(saved => saved?.saved === false ? EMPTY
        : this.readCurrent().pipe(tap(calendar => this.reconcile(calendar, command))))));
    });
  }

  refresh(discard = false): Observable<AdminGlobalCalendarResult> {
    return defer(() => {
      if (this.isBusy() || this.blocked() || (discard && !this.canDiscard())) return EMPTY;
      if (!this.readbackPending()) this.invalidatePreview();
      return this.run('read', this.readCurrent().pipe(tap(calendar => {
        const command = this.command();
        if (this.readbackPending() && command) this.reconcile(calendar, command);
        else if (discard || !this.dirty()) this.populate(calendar);
        else if (calendar.calendarRevision !== this.baseline?.calendarRevision || calendar.draftRevision !== this.baseline.draftRevision) this.conflict();
      })));
    });
  }

  private readCurrent(): Observable<AdminGlobalCalendarResult> {
    const core = this.core();
    assertEdgeContract(core !== null, 'globalBaseTimeBlocks', 'a loaded owner Core');
    return forkJoin({ core: this.admin.getCoreDetail(core.id), calendar: this.admin.getGlobalCalendar(core.id) }).pipe(map(result => {
      assertEdgeContract(result.core !== null && result.core.id === core.id, 'globalBaseTimeBlocks', 'an authoritative owner Core');
      assertBaseCalendar(result.core, result.calendar);
      this.core.set(result.core);
      this.calendar.set(result.calendar);
      return result.calendar;
    }));
  }

  private reconcile(calendar: AdminGlobalCalendarResult, command: GlobalBaseTimeBlocksCommand): void {
    if (matchesBaseTimeBlocks(calendar, command) && this.canEdit()) {
      const outcome = command.outcome;
      this.populate(calendar);
      this.error.set(null);
      this.result.set(outcome === 'unchanged' ? 'unchanged' : 'saved');
    } else if (command.outcome !== null) {
      this.readbackPending.set(false);
      this.conflict();
    }
  }

  private populate(calendar: AdminGlobalCalendarResult): void {
    this.baseline = calendar;
    this.command.set(null);
    this.preview.set(null);
    this.conflicted.set(false);
    this.readbackPending.set(false);
    this.result.set(null);
    this.validationAttempted.set(false);
    this.form.setControl('timeBlocks', createEventGlobalTimeBlocksForm(calendar.timeBlocks, 'saved-base'));
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private conflict(): void {
    this.conflicted.set(true);
    this.invalidatePreview();
    this.form.markAsDirty();
  }

  private invalidatePreview(): void {
    this.preview.set(null);
    if (!this.readbackPending()) this.command.set(null);
    this.result.set(null);
  }

  private run<T>(operation: 'preview' | 'save' | 'read', request: Observable<T>): Observable<T> {
    this.operation.set(operation);
    this.error.set(null);
    this.result.set(null);
    return request.pipe(tap({ error: error => {
      this.error.set(error);
      if (!this.readbackPending()) {
        this.invalidatePreview();
        if (error instanceof RpcError && error.code === '40001') this.conflict();
      }
    } }), finalize(() => this.operation.set(null)));
  }
}
