import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { catchError, defer, EMPTY, finalize, forkJoin, map, Observable, switchMap, tap, throwError } from 'rxjs';

import { mapGlobalSchedule } from '../../../../core/factories/event-global-draft-form.factory';
import { createEventScheduleForm, mapEventScheduleFormToPayload, populateEventScheduleForm } from '../../../../core/factories/event-schedule-form.factory';
import type { AdminGlobalCalendarPreview, AdminGlobalCalendarResult } from '../../../../core/interfaces/i-admin-global-event';
import type { IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { RpcError } from '../../../../core/types/rpc-error';
import { assertEdgeContract } from '../../../../core/utils/edge-contract';
import { activeScheduleBlocks, EventGlobalScheduleError, type GlobalScheduleCommand, type GlobalScheduleIssue,
  matchesAppliedSchedule, matchesSavedSchedule, preserveScheduleExclusions, sameScheduleChange,
  validateScheduleContext } from './event-global-schedule-state';

type ScheduleState = 'idle' | 'draft' | 'save-uncertain' | 'save-readback' | 'apply-uncertain' | 'apply-readback' | 'conflict';

@Injectable()
export class EventGlobalScheduleController {
  private readonly admin = inject(EventAdmin);
  private readonly core = signal<IEventCoreDetail | null>(null);
  private readonly command = signal<GlobalScheduleCommand | null>(null);
  private editBaseline: AdminGlobalCalendarResult | null = null;
  private readonly operation = signal<'preview' | 'save' | 'apply' | 'read' | null>(null);
  private readonly allowed = signal(false);
  readonly blocked = signal(false);
  readonly calendar = signal<AdminGlobalCalendarResult | null>(null);
  readonly form = createEventScheduleForm(true);
  private readonly formEvents = toSignal(this.form.events);
  readonly dirty = computed(() => { this.formEvents(); return this.form.dirty; });
  readonly state = signal<ScheduleState>('idle');
  readonly preview = signal<AdminGlobalCalendarPreview | null>(null);
  readonly issue = signal<GlobalScheduleIssue | null>(null);
  readonly error = signal<unknown | null>(null);
  readonly result = signal<'draft' | 'applied' | null>(null);
  readonly validationAttempted = signal(false);
  readonly isBusy = computed(() => this.operation() !== null);
  readonly locked = computed(() => this.isBusy() || this.dirty() || this.state() !== 'idle');
  readonly canEdit = computed(() => this.allowed() && !this.blocked());
  readonly canPreview = computed(() => this.canEdit() && !this.isBusy() && this.state() === 'idle' && this.dirty());
  readonly canSave = computed(() => {
    const command = this.command();
    const preview = this.preview();
    return this.canPreview() && command !== null && preview?.valid === true &&
      preview.currentDraftRevision === command.baseline.draftRevision && sameScheduleChange(preview, command);
  });
  readonly canApply = computed(() => this.canEdit() && !this.isBusy() && this.state() === 'draft' &&
    this.command() !== null && this.command()?.savedRevision !== null);
  readonly canDiscard = computed(() => !this.isBusy() && !this.blocked() &&
    ['idle', 'draft', 'conflict'].includes(this.state()) && (this.dirty() || this.state() !== 'idle'));

  constructor() {
    effect(() => {
      if (!this.canEdit() || this.isBusy() || this.state() !== 'idle') this.form.disable({ emitEvent: false });
      else this.form.enable({ emitEvent: false });
    });
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.preview.set(null);
      if (this.state() === 'idle') this.command.set(null);
    });
  }

  reset(): void {
    this.command.set(null);
    this.editBaseline = null;
    this.operation.set(null);
    this.core.set(null);
    this.calendar.set(null);
    this.allowed.set(false);
    this.state.set('idle');
    this.preview.set(null);
    this.issue.set(null);
    this.error.set(null);
    this.result.set(null);
    this.validationAttempted.set(false);
    this.form.reset();
  }

  load(core: IEventCoreDetail, calendar: AdminGlobalCalendarResult): void {
    if (this.locked()) return;
    this.core.set(core);
    this.calendar.set(calendar);
    this.error.set(null);
    this.preview.set(null);
    this.result.set(null);
    this.validationAttempted.set(false);
    try {
      validateScheduleContext(core, calendar);
      this.allowed.set(true);
      this.issue.set(null);
    } catch (error: unknown) {
      this.allowed.set(false);
      this.recordFailure(error);
    }
    this.restoreForm(calendar);
    if (calendar.pendingDraft && this.allowed()) this.form.markAsDirty();
  }

  previewChanges(): Observable<AdminGlobalCalendarPreview> {
    return defer(() => {
      this.validationAttempted.set(true);
      this.form.markAllAsTouched();
      if (!this.canPreview() || this.form.invalid) return EMPTY;
      const previous = this.editBaseline;
      assertEdgeContract(previous !== null, 'globalSchedule', 'a loaded calendar');
      const schedule = mapGlobalSchedule(mapEventScheduleFormToPayload(this.form));
      return this.run('preview', this.readCurrent().pipe(switchMap(calendar => {
        if (calendar.calendarRevision !== previous.calendarRevision || calendar.draftRevision !== previous.draftRevision) {
          throw new EventGlobalScheduleError('conflict');
        }
        const timeBlocks = calendar.pendingDraft ? calendar.pendingDraft.timeBlocks : activeScheduleBlocks(calendar);
        return this.admin.previewGlobalCalendar({ coreId: calendar.coreId, schedule, timeBlocks, cityExclusions: [] }).pipe(
          switchMap(probe => {
            assertEdgeContract(probe.appliedToPublic === false && typeof probe.valid === 'boolean' &&
              Array.isArray(probe.fieldErrors) && Array.isArray(probe.blockers),
            'globalScheduleProbe', 'a read-only FULL or SHORT preview');
            if (probe.status === 'invalid') { this.preview.set(probe); return EMPTY; }
            assertEdgeContract(probe.coreId === calendar.coreId && Array.isArray(probe.candidateDates),
              'globalScheduleProbe', 'authoritative candidate dates, regardless of probe approval');
            const cityExclusions = preserveScheduleExclusions(calendar, probe.candidateDates);
            const command: GlobalScheduleCommand = { coreId: calendar.coreId, schedule, timeBlocks, cityExclusions,
              baseline: calendar, savedRevision: null, appliedRevision: null };
            return this.admin.previewGlobalCalendar(command).pipe(tap(preview => {
              this.preview.set(preview);
              if (preview.status !== 'invalid') {
                assertEdgeContract(preview.currentDraftRevision === calendar.draftRevision && sameScheduleChange(preview, command) &&
                  preview.appliedToPublic === false && preview.published === false &&
                  ((preview.valid === true && preview.status === 'draft_ready') || (preview.valid === false && preview.status === 'blocked')),
                'globalSchedulePreview', 'the exact schedule-only change and draft revision');
              }
              this.command.set(preview.valid ? command : null);
            }));
          }),
        );
      })));
    });
  }

  save(): Observable<AdminGlobalCalendarResult> {
    return defer(() => {
      const command = this.command();
      if (!command || !this.canSave()) return EMPTY;
      this.state.set('save-uncertain');
      return this.run('save', this.admin.saveGlobalCalendarDraft(command, command.baseline.draftRevision).pipe(
        switchMap(saved => {
          assertEdgeContract(saved.coreId === command.coreId && saved.calendarLifecycle === 'global' &&
            Number.isInteger(saved.revision) && ((saved.saved === true && saved.status === 'draft_saved') ||
              (saved.saved === false && saved.status === 'blocked' && saved.preview.valid === false)),
          'globalScheduleSave', 'a confirmed saved or blocked result for this Core');
          this.preview.set(saved.preview);
          if (!saved.saved) { this.state.set('idle'); this.command.set(null); return EMPTY; }
          assertEdgeContract(saved.status === 'draft_saved' && saved.coreId === command.coreId &&
            saved.calendarLifecycle === 'global' && saved.revision === command.baseline.draftRevision + 1 &&
            saved.appliedToPublic === false && saved.preview.valid && sameScheduleChange(saved.preview, command),
          'globalScheduleSave', 'a confirmed draft save, separate from application');
          command.savedRevision = saved.revision;
          this.state.set('save-readback');
          return this.readCurrent().pipe(tap(calendar => this.reconcile(calendar)));
        }),
        catchError(error => this.reconcileWriteFailure(error)),
      ));
    });
  }

  apply(): Observable<AdminGlobalCalendarResult> {
    return defer(() => {
      const command = this.command();
      if (!command || command.savedRevision === null || !this.canApply()) return EMPTY;
      this.state.set('apply-uncertain');
      return this.run('apply', this.admin.applyGlobalCalendarDraft(command.coreId, command.baseline.calendarRevision, command.savedRevision).pipe(
        tap(applied => {
          assertEdgeContract(applied.applied === true && applied.coreId === command.coreId && applied.calendarLifecycle === 'global' &&
            applied.calendarRevision === command.baseline.calendarRevision + 1 && applied.appliedDraftRevision === command.savedRevision &&
            applied.published === false && applied.appliedToPublic === false && applied.participantSignupOpened === false,
          'globalScheduleApply', 'application of this confirmed draft without publication');
          command.appliedRevision = applied.calendarRevision;
          this.state.set('apply-readback');
        }),
        switchMap(() => this.readCurrent()), tap(calendar => this.reconcile(calendar)),
        catchError(error => this.reconcileWriteFailure(error)),
      ));
    });
  }

  refresh(): Observable<AdminGlobalCalendarResult> {
    return defer(() => {
      if (this.isBusy() || this.blocked()) return EMPTY;
      return this.run('read', this.readCurrent(false).pipe(tap(calendar => {
        if (this.command() && this.state() !== 'idle' && this.state() !== 'conflict') this.reconcile(calendar);
        else if (this.dirty() && this.editBaseline && (calendar.calendarRevision !== this.editBaseline.calendarRevision ||
          calendar.draftRevision !== this.editBaseline.draftRevision)) throw new EventGlobalScheduleError('conflict');
        else if (!this.dirty()) this.restoreForm(calendar);
        else this.state.set('idle');
      })));
    });
  }

  discardLocalChanges(): Observable<AdminGlobalCalendarResult> {
    return defer(() => this.canDiscard()
      ? this.run('read', this.readCurrent(false).pipe(tap(calendar => this.restoreForm(calendar)))) : EMPTY);
  }

  private readCurrent(requireEditable = true): Observable<AdminGlobalCalendarResult> {
    const core = this.core();
    assertEdgeContract(core !== null, 'globalSchedule', 'the owner Core');
    return forkJoin({ core: this.admin.getCoreDetail(core.id), calendar: this.admin.getGlobalCalendar(core.id) }).pipe(map(result => {
      assertEdgeContract(result.core !== null && result.core.id === core.id, 'globalSchedule', 'an authoritative Core readback');
      this.core.set(result.core);
      this.calendar.set(result.calendar);
      try {
        validateScheduleContext(result.core, result.calendar);
        this.allowed.set(true);
      } catch (error: unknown) {
        if (requireEditable || !(error instanceof EventGlobalScheduleError)) throw error;
        this.allowed.set(false);
        this.recordFailure(error);
      }
      return result.calendar;
    }));
  }

  private reconcile(calendar: AdminGlobalCalendarResult): void {
    const command = this.command();
    assertEdgeContract(command !== null, 'globalSchedule', 'the pending local command');
    if (this.state().startsWith('apply-') && matchesAppliedSchedule(calendar, command)) {
      this.error.set(null);
      this.issue.set(null);
      this.restoreForm(calendar);
      this.result.set('applied');
    } else if (!this.state().startsWith('apply-') && matchesSavedSchedule(calendar, command)) {
      this.error.set(null);
      this.issue.set(null);
      command.savedRevision = calendar.draftRevision;
      this.editBaseline = calendar;
      this.state.set('draft');
      this.form.markAsPristine();
      this.result.set('draft');
    } else if (this.state().endsWith('uncertain')) {
      this.issue.set('readback');
    } else {
      this.state.set('conflict');
      this.form.markAsDirty();
      this.command.set(null);
      this.issue.set('conflict');
    }
  }

  private run<T>(operation: 'preview' | 'save' | 'apply' | 'read', request: Observable<T>): Observable<T> {
    if (operation === 'preview' || (operation === 'read' && (this.state() === 'idle' || this.state() === 'conflict'))) {
      this.preview.set(null);
      this.command.set(null);
    }
    this.operation.set(operation);
    this.error.set(null);
    this.issue.set(null);
    this.result.set(null);
    return request.pipe(tap({ error: error => this.recordFailure(error) }), finalize(() => this.operation.set(null)));
  }

  private reconcileWriteFailure(error: unknown): Observable<AdminGlobalCalendarResult> {
    const uncertain = this.state().endsWith('uncertain');
    this.recordFailure(error, uncertain);
    if (!uncertain || !this.state().endsWith('uncertain')) return throwError(() => error);
    return this.readCurrent().pipe(tap(calendar => this.reconcile(calendar)));
  }

  private recordFailure(error: unknown, writeFailure = false): void {
    this.error.set(error);
    if (error instanceof EventGlobalScheduleError) {
      this.issue.set(error.issue);
      if (error.issue === 'conflict') { this.state.set('conflict'); this.command.set(null); this.form.markAsDirty(); }
      else this.allowed.set(false);
    }
    if (writeFailure && error instanceof RpcError && ['40001', '42501', '22023', '22P02', '23514', 'P0002'].includes(error.code)) {
      this.preview.set(null);
      if (error.code === '40001') {
        this.state.set('conflict'); this.command.set(null); this.issue.set('conflict'); this.form.markAsDirty();
      }
      else if (this.state() === 'save-uncertain') { this.state.set('idle'); this.command.set(null); }
      else if (this.state() === 'apply-uncertain') {
        this.state.set('conflict'); this.command.set(null); this.form.markAsDirty();
      }
      if (error.code === '23514') this.issue.set('protected');
    }
  }

  private restoreForm(calendar: AdminGlobalCalendarResult): void {
    this.editBaseline = calendar;
    this.command.set(null);
    this.preview.set(null);
    this.result.set(null);
    this.state.set('idle');
    this.validationAttempted.set(false);
    populateEventScheduleForm(this.form, calendar.pendingDraft?.schedule ?? calendar.schedule);
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }
}
