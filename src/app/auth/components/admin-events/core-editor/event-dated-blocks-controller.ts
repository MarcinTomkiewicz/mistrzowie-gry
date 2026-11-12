import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup } from '@angular/forms';
import { defer, EMPTY, finalize, Observable, switchMap, tap } from 'rxjs';

import { createEventGlobalTimeBlocksForm, mapEventGlobalTimeBlocks } from '../../../../core/factories/event-global-time-block-form.factory';
import type { AdminDatedTimeBlocksPreview, AdminGlobalCalendarResult, EventDatedTimeBlocksCommand } from '../../../../core/interfaces/i-admin-global-event';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { RpcError } from '../../../../core/types/rpc-error';
import { assertEdgeContract } from '../../../../core/utils/edge-contract';
import { EventGlobalScheduleController } from './event-global-schedule-controller';
import { EventGlobalBaseTimeBlocksController } from './event-global-base-time-blocks-controller';
import { matchesDatedBlocksReadback } from './event-dated-blocks-state';
import { sameScheduleBlocks, type GlobalScheduleBlocker } from './event-global-schedule-state';

@Injectable()
export class EventDatedBlocksController {
  private readonly admin = inject(EventAdmin);
  private readonly schedule = inject(EventGlobalScheduleController);
  private readonly baseBlocks = inject(EventGlobalBaseTimeBlocksController);
  private command: EventDatedTimeBlocksCommand | null = null;
  private writeBaseline: AdminGlobalCalendarResult | null = null;
  private readonly operation = signal<'preview' | 'save' | 'read' | null>(null);
  private savedRevision: number | null = null;
  readonly calendar = signal<AdminGlobalCalendarResult | null>(null);
  readonly date = signal('');
  readonly editionId = signal('');
  readonly preview = signal<AdminDatedTimeBlocksPreview | null>(null);
  readonly conflicted = signal(false);
  readonly error = signal<unknown | null>(null);
  readonly readbackPending = signal(false);
  readonly validationAttempted = signal(false);
  readonly form = new FormGroup({
    override: new FormControl(false, { nonNullable: true }),
    timeBlocks: createEventGlobalTimeBlocksForm([]),
  });
  private readonly formEvents = toSignal(this.form.events);
  readonly isDirty = computed(() => { this.formEvents(); return this.form.dirty; });
  readonly hasChanges = computed(() => {
    this.formEvents();
    const override = this.editionId() ? this.city()?.isOverride : this.day()?.source === 'date_specific';
    return this.form.dirty && (this.form.invalid || this.form.controls.override.value !== override ||
      this.form.controls.override.value && !sameScheduleBlocks(mapEventGlobalTimeBlocks(this.form.controls.timeBlocks), this.currentBlocks()));
  });
  readonly isBusy = computed(() => this.operation() !== null);
  readonly day = computed(() => this.calendar()?.datedTimeBlocks.find(row => row.date === this.date()));
  readonly city = computed(() => this.day()?.cities.find(row => row.editionId === this.editionId()));
  readonly currentBlocks = computed(() => this.editionId() ? this.city()?.timeBlocks ?? [] : this.day()?.timeBlocks ?? []);
  readonly contextBlocker = computed<GlobalScheduleBlocker | null>(() => {
    const day = this.day();
    if (!day) return null;
    const occurrence = this.calendar()?.globalDates.find(row => row.globalOccurrenceId === day.globalOccurrenceId && row.date === day.date);
    if (!occurrence || day.source === 'published_snapshot' || occurrence.status !== 'scheduled') return 'protected';
    if (this.editionId() && !this.city()) return 'protected';
    const targets = this.editionId() ? occurrence.cityOccurrences.filter(row => row.editionId === this.editionId()) : occurrence.cityOccurrences;
    return targets.length > 0 && targets.every(row => !row.protected && !row.publishedAt &&
      (row.occurrenceStatus === null || row.occurrenceStatus === 'planned')) ? null : 'protected';
  });
  readonly blockingReason = computed<GlobalScheduleBlocker | null>(() => this.contextBlocker() ??
    (this.schedule.blocked() || this.baseBlocks.blocked() || this.schedule.isBusy() || this.baseBlocks.isBusy() || this.isBusy() ? 'otherOperation' : null));
  readonly canEdit = computed(() => !!this.day() && this.contextBlocker() === null && !this.schedule.blocked() &&
    !this.baseBlocks.blocked() && !this.schedule.isBusy() && !this.baseBlocks.isBusy());

  constructor() {
    effect(() => this.syncEnabled());
    this.form.controls.override.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.syncEnabled());
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.invalidatePreview());
  }

  reset(): void {
    this.operation.set(null);
    this.savedRevision = null;
    this.command = null;
    this.writeBaseline = null;
    this.calendar.set(null);
    this.readbackPending.set(false);
    this.error.set(null);
    this.populate('', '');
  }

  load(calendar: AdminGlobalCalendarResult): void {
    if (this.isDirty() || this.readbackPending()) return;
    assertEdgeContract(Array.isArray(calendar.datedTimeBlocks), 'datedTimeBlocks', 'the canonical dated calendar');
    this.calendar.set(calendar);
    const date = calendar.datedTimeBlocks.some(row => row.date === this.date()) ? this.date() : calendar.datedTimeBlocks[0]?.date ?? '';
    const day = calendar.datedTimeBlocks.find(row => row.date === date);
    const editionId = day?.cities.some(row => row.editionId === this.editionId()) ? this.editionId() : '';
    this.populate(date, editionId);
  }

  select(date: string, editionId: string): void {
    if (this.schedule.isBusy() || this.baseBlocks.isBusy() || this.isBusy() || this.isDirty() || this.readbackPending()) return;
    this.populate(date, editionId);
  }

  acceptCalendarReadback(calendar: AdminGlobalCalendarResult): void {
    const previous = this.calendar();
    const day = previous?.datedTimeBlocks.find(row => row.date === this.date());
    const current = calendar.datedTimeBlocks.find(row => row.date === this.date());
    assertEdgeContract(previous?.coreId === calendar.coreId && (!this.isDirty() || day !== undefined && current !== undefined &&
      day.globalOccurrenceId === current.globalOccurrenceId), 'datedTimeBlocks.baseline', 'the retained shared date of the local edit');
    if (this.isDirty()) this.calendar.set(calendar);
    else this.load(calendar);
  }

  previewChanges(): Observable<AdminDatedTimeBlocksPreview> {
    return defer(() => {
      this.error.set(null);
      this.validationAttempted.set(true);
      this.form.markAllAsTouched();
      if (!this.canEdit() || this.isBusy() || !this.isDirty() || this.form.invalid || this.conflicted() || this.readbackPending()) return EMPTY;
      const calendar = this.calendar();
      if (!calendar) return EMPTY;
      const row = { date: this.date(), timeBlocks: this.form.controls.override.value ? mapEventGlobalTimeBlocks(this.form.controls.timeBlocks) : null };
      const command: EventDatedTimeBlocksCommand = {
        coreId: calendar.coreId, expectedCalendarRevision: calendar.calendarRevision,
        dateTimeBlocks: this.editionId() ? [] : [row],
        cityDateTimeBlocks: this.editionId() ? [{ ...row, editionId: this.editionId() }] : [],
      };
      this.writeBaseline = calendar;
      this.invalidatePreview();
      this.operation.set('preview');
      this.form.disable({ emitEvent: false });
      return this.admin.previewDatedTimeBlocks(command).pipe(tap(result => {
        assertEdgeContract(result.valid === true && result.status === 'preview_ready' && result.applied === false &&
          result.coreId === command.coreId && result.calendarRevision === command.expectedCalendarRevision &&
          result.published === false && result.participantSignupOpened === false,
        'datedTimeBlocksPreview', 'a valid preview for the selected calendar revision');
        this.command = command;
        this.preview.set(result);
      }), tap({ error: error => this.recordFailure(error) }), finalize(() => this.finishOperation()));
    });
  }

  save(): Observable<AdminGlobalCalendarResult> {
    return defer(() => {
      this.error.set(null);
      const command = this.command;
      if (!command || !this.preview() || this.isBusy() || !this.canEdit() || this.conflicted() || this.readbackPending()) return EMPTY;
      this.operation.set('save');
      this.readbackPending.set(true);
      this.form.disable({ emitEvent: false });
      return this.admin.saveDatedTimeBlocks(command).pipe(
        tap(result => {
          this.preview.set(null);
          assertEdgeContract(result.status === 'draft_saved' && result.applied === true && result.calendarRevision > command.expectedCalendarRevision,
            'datedTimeBlocksSave', 'a saved draft with an advanced calendar revision');
          this.savedRevision = result.calendarRevision;
        }),
        tap({ error: error => this.recordFailure(error, true) }),
        switchMap(() => this.readCalendar(command.coreId)),
        tap({ error: error => this.recordFailure(error) }),
        finalize(() => this.finishOperation()),
      );
    });
  }

  refresh(): Observable<AdminGlobalCalendarResult> {
    return defer(() => {
      this.error.set(null);
      const calendar = this.calendar();
      if (!calendar || !this.readbackPending() || !this.command || this.isBusy() || this.schedule.isBusy() || this.baseBlocks.isBusy()) return EMPTY;
      this.operation.set('read');
      this.form.disable({ emitEvent: false });
      return this.readCalendar(calendar.coreId).pipe(tap({ error: error => this.recordFailure(error) }),
        finalize(() => this.finishOperation()));
    });
  }

  private readCalendar(coreId: string): Observable<AdminGlobalCalendarResult> {
    return this.admin.getGlobalCalendar(coreId).pipe(tap(calendar => {
      assertEdgeContract(calendar.coreId === coreId && calendar.calendarLifecycle === 'global' &&
        (this.savedRevision === null || calendar.calendarRevision >= this.savedRevision),
      'globalCalendar', 'the canonical calendar after the confirmed draft save');
      if (this.readbackPending()) {
        assertEdgeContract(this.command !== null && this.writeBaseline !== null &&
          matchesDatedBlocksReadback(this.writeBaseline, calendar, this.command, this.savedRevision),
        'datedTimeBlocks.readback', 'the exact saved overrides, inherited blocks and unchanged remaining scope');
      }
      this.form.markAsPristine();
      this.readbackPending.set(false);
      this.load(calendar);
      this.savedRevision = null;
      this.writeBaseline = null;
    }));
  }

  private populate(date: string, editionId: string): void {
    this.date.set(date);
    this.editionId.set(editionId);
    const day = this.day();
    const city = this.city();
    assertEdgeContract(!date || (day !== undefined && (!editionId || city !== undefined)), 'datedTimeBlocks', 'the selected date and city');
    const blocks = editionId ? city?.timeBlocks : day?.timeBlocks;
    this.form.setControl('timeBlocks', createEventGlobalTimeBlocksForm(blocks ?? []), { emitEvent: false });
    this.form.controls.override.setValue(editionId ? city?.isOverride === true : day?.source === 'date_specific', { emitEvent: false });
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.validationAttempted.set(false);
    this.conflicted.set(false);
    this.invalidatePreview();
    this.syncEnabled();
  }

  private invalidatePreview(): void {
    this.preview.set(null);
    if (!this.readbackPending()) this.command = null;
  }

  private recordFailure(error: unknown, writeFailure = false): void {
    this.error.set(error);
    if (writeFailure && this.readbackPending() && error instanceof RpcError &&
      ['40001', '42501', '22023', '22P02', '23514', 'P0002'].includes(error.code)) this.readbackPending.set(false);
    this.invalidatePreview();
    if (error instanceof RpcError && error.code === '40001') this.conflicted.set(true);
  }

  private finishOperation(): void {
    this.operation.set(null);
    this.syncEnabled();
  }

  private syncEnabled(): void {
    if (this.isBusy() || this.readbackPending() || !this.canEdit()) {
      this.form.disable({ emitEvent: false });
      return;
    }
    this.form.enable({ emitEvent: false });
    if (!this.form.controls.override.value) this.form.controls.timeBlocks.disable({ emitEvent: false });
  }
}
