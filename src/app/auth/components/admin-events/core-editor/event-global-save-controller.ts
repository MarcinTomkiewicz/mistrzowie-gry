import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import type { AbstractControl } from '@angular/forms';
import { asapScheduler, catchError, concatMap, defer, EMPTY, finalize, from, map, merge, Observable, observeOn, of, switchMap, tap, throwError, throwIfEmpty, toArray } from 'rxjs';

import type { IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import type { AdminEventPolicyDraft } from '../../../../core/interfaces/i-admin-event-policy';
import type { AdminGlobalCalendarPreview, AdminGlobalCalendarResult } from '../../../../core/interfaces/i-admin-global-event';
import type { EventGlobalSavePhase, GlobalSaveCheckReason } from '../../../../core/interfaces/i-event-global-saved-summary';
import { assertEdgeContract } from '../../../../core/utils/edge-contract';
import { normalizeText } from '../../../../core/utils/normalize-text';
import { EventGlobalSaveError } from '../event-admin-errors';
import { EventCoreMetadataController } from './event-core-metadata-controller';
import { EventDatedBlocksController } from './event-dated-blocks-controller';
import { EventGlobalBaseTimeBlocksController } from './event-global-base-time-blocks-controller';
import { EventGlobalDraftController } from './event-global-draft-controller';
import { EventGlobalScheduleController } from './event-global-schedule-controller';
import { EventGlobalPolicyFacade } from './policy/event-global-policy-facade';
import { EventCoreCoverController } from './event-core-cover-controller';
import { EventManualProgramController } from './event-manual-program-controller';
import { EventGlobalPublicationController } from './event-global-publication-controller';

const GLOBAL_SAVE_SECTIONS = ['base', 'schedule', 'dated', 'policy', 'core', 'edition'] as const;
export type GlobalSaveSection = typeof GLOBAL_SAVE_SECTIONS[number];
export const GLOBAL_SAVE_STEPS: Record<GlobalSaveSection, number> = { core: 1, edition: 2, base: 3, schedule: 3, dated: 3, policy: 4 };

// Coordinates existing guarded writers. Every accepted section has its own canonical readback.
@Injectable()
export class EventGlobalSaveController {
  private readonly global = inject(EventGlobalDraftController);
  private readonly cover = inject(EventCoreCoverController);
  private readonly program = inject(EventManualProgramController);
  private readonly publication = inject(EventGlobalPublicationController);
  readonly metadata = inject(EventCoreMetadataController);
  readonly schedule = inject(EventGlobalScheduleController);
  readonly base = inject(EventGlobalBaseTimeBlocksController);
  readonly dated = inject(EventDatedBlocksController);
  readonly policy = inject(EventGlobalPolicyFacade);
  readonly forms: Readonly<Record<GlobalSaveSection, AbstractControl>> = {
    core: this.metadata.coreForm, edition: this.metadata.editionForm, base: this.base.form,
    schedule: this.schedule.form, dated: this.dated.form, policy: this.policy.form,
  };
  private readonly formEvents = toSignal(merge(...GLOBAL_SAVE_SECTIONS.map(key => this.forms[key].events)));
  private readonly baseline = signal<Partial<Record<GlobalSaveSection, string>>>({});
  private policyCalendarRevision: number | null = null;
  private verifiedCalendar: AdminGlobalCalendarResult | null = null;
  readonly busy = signal(false);
  readonly checking = signal(false);
  readonly phase = signal<EventGlobalSavePhase>('check');
  private readonly checkedSignature = signal<string | null>(null);
  readonly checked = computed(() => this.checkedSignature() !== null && this.checkedSignature() === this.signature());
  readonly completed = signal<GlobalSaveSection[]>([]);
  readonly failed = signal<GlobalSaveSection | null>(null);
  readonly error = signal<unknown | null>(null);
  readonly checkIssue = signal<{ reason: GlobalSaveCheckReason; section: GlobalSaveSection | null } | null>(null);
  readonly pending = computed(() => this.metadata.pendingTarget() !== null || this.base.readbackPending() ||
    this.dated.readbackPending() || this.policy.readbackPending() || /-(uncertain|readback)$/.test(this.schedule.state()));
  // Write selection can shrink after a confirmed no-op; it is not the data signature.
  readonly changed = computed(() => {
    this.formEvents();
    const baseline = this.baseline();
    return GLOBAL_SAVE_SECTIONS.filter(key => {
      if (baseline[key] === undefined) return false;
      if (key === 'core' || key === 'edition') return this.value(key) !== baseline[key];
      if (key === 'dated') return this.dated.isDirty();
      return this[key].dirty() || key === 'schedule' && this.schedule.state() === 'draft';
    });
  });
  readonly dirty = computed(() => this.changed().length > 0);
  readonly blockingReason = computed<GlobalSaveCheckReason | null>(() => {
    if (this.cover.locked() || this.cover.needsReconciliation()) return 'coverPending';
    if (this.cover.dirty()) return 'coverDirty';
    if (this.program.locked()) return 'program';
    if (this.publication.locked()) return 'publication';
    if (this.global.cityEditing() || this.global.cityBusy()) return 'city';
    return this.global.isChecking() ? 'diagnostics' : null;
  });
  readonly blocked = computed(() => this.blockingReason() !== null);

  constructor() {
    effect(() => {
      const blocked = this.blocked();
      this.schedule.blocked.set(blocked);
      this.base.blocked.set(blocked);
      this.policy.blocked.set(blocked);
    });
    effect(() => {
      if (this.busy() || this.pending()) return;
      const changed = this.changed();
      untracked(() => {
        if (this.completed().some(key => changed.includes(key))) this.completed.update(done => done.filter(key => !changed.includes(key)));
      });
    });
  }

  reset(): void {
    for (const controller of [this.metadata, this.schedule, this.base, this.dated, this.policy]) controller.reset();
    this.baseline.set({});
    this.policyCalendarRevision = null;
    this.verifiedCalendar = null;
    this.busy.set(false);
    this.checking.set(false);
    this.phase.set('check');
    this.checkedSignature.set(null);
    this.completed.set([]);
    this.failed.set(null);
    this.error.set(null);
    this.checkIssue.set(null);
  }

  load(core: IEventCoreDetail, policyDraft?: AdminEventPolicyDraft): Observable<unknown> {
    const calendar = this.global.calendar();
    assertEdgeContract(calendar !== null && calendar.coreId === core.id, 'globalSave.load', 'the canonical Global calendar');
    this.verifiedCalendar = calendar;
    this.schedule.load(core, calendar);
    this.base.load(core, calendar);
    this.dated.load(calendar);
    return this.policy.load(core, policyDraft).pipe(tap(() => {
      this.policyCalendarRevision = calendar.calendarRevision;
      this.baseline.set(Object.fromEntries(GLOBAL_SAVE_SECTIONS.map(key => [key, this.value(key)])));
    }));
  }

  validate(): GlobalSaveSection | null {
    const changed = [...this.changed()].sort((a, b) => GLOBAL_SAVE_STEPS[a] - GLOBAL_SAVE_STEPS[b]);
    for (const key of changed) {
      if (key !== 'core' && key !== 'edition') this[key].validationAttempted.set(true);
      this.forms[key].markAllAsTouched();
      if (this.forms[key].invalid || this.forms[key].pending) {
        this.checkIssue.set({ reason: 'invalid', section: key });
        return key;
      }
    }
    return null;
  }

  check(externallyBlocked = false): Observable<boolean> {
    return defer(() => {
      const activeSection = GLOBAL_SAVE_SECTIONS.find(key => key === 'core' || key === 'edition' ? this.metadata.isBusy() : this[key].isBusy());
      const reason = this.busy() || activeSection ? 'busy' : this.pending() ? 'pending' : this.blockingReason() ??
        (externallyBlocked ? 'otherOperation' : !this.dirty() ? 'unchanged' : null);
      if (reason) {
        if (!this.busy() && !this.pending()) { this.error.set(null); this.failed.set(activeSection ?? null); }
        this.checkIssue.set({ reason, section: reason === 'pending' ? this.failed() : activeSection ?? null });
        return of(false);
      }
      this.phase.set('check');
      this.checkedSignature.set(null);
      this.checkIssue.set(null);
      this.error.set(null);
      this.failed.set(null);
      const invalid = this.validate();
      if (invalid) { this.failed.set(invalid); return of(false); }
      const changed = this.changed();
      const signature = this.signature();
      this.busy.set(true);
      this.checking.set(true);
      return from(changed).pipe(concatMap(key => {
        this.failed.set(key);
        return this.previewSection(key).pipe(tap(() => this.requireReady(key)));
      }), toArray(), map(() => {
        if (signature !== this.signature()) {
          this.failed.set(null);
          this.checkIssue.set({ reason: 'changed', section: null });
          return false;
        }
        this.failed.set(null);
        this.checkIssue.set(null);
        this.checkedSignature.set(signature);
        return true;
      }), catchError((error: unknown) => {
        this.checkIssue.set({ reason: 'section', section: this.failed() });
        this.error.set(error);
        return throwError(() => error);
      }),
      finalize(() => { this.checking.set(false); this.busy.set(false); }));
    });
  }

  save(): Observable<void> {
    return defer(() => {
      if (this.blocked() || this.busy() || this.pending() || !this.dirty() || !this.checked()) {
        const reason: GlobalSaveCheckReason = this.busy() ? 'busy' : this.pending() ? 'pending'
          : this.blockingReason() ?? (!this.dirty() ? 'unchanged' : 'changed');
        if (!this.busy() && !this.pending()) this.failed.set(null);
        this.checkIssue.set({ reason, section: this.pending() ? this.failed() : null });
        return throwError(() => new EventGlobalSaveError('unavailable'));
      }
      const invalid = this.validate();
      if (invalid) { this.failed.set(invalid); return throwError(() => new EventGlobalSaveError('unavailable')); }
      this.busy.set(true);
      this.checkedSignature.set(null);
      this.error.set(null);
      this.checkIssue.set(null);
      return from(this.changed()).pipe(concatMap(key => {
        this.failed.set(key);
        // Existing controllers release their busy guards in finalize, before the next operation starts.
        return this.writeSection(key).pipe(throwIfEmpty(() => new EventGlobalSaveError('empty')), observeOn(asapScheduler), tap(() => {
          this.accept(key);
        }));
      }), toArray(), map(() => { this.failed.set(null); }),
      finalize(() => this.busy.set(false)));
    }).pipe(catchError((error: unknown) => { this.error.set(error); return throwError(() => error); }));
  }

  retryReadback(): Observable<void> {
    return defer(() => {
      const key = this.failed();
      if (!key || !this.pending() || this.busy()) return EMPTY;
      this.busy.set(true);
      this.error.set(null);
      this.checkIssue.set(null);
      this.phase.set('readback');
      const read: Observable<unknown> = key === 'core' || key === 'edition' ? this.metadata.save(key)
        : this[key].refresh();
      return read.pipe(throwIfEmpty(() => new EventGlobalSaveError('empty')), observeOn(asapScheduler), map(() => {
        if (this.pending()) throw new EventGlobalSaveError('unconfirmed');
        const outcome = this.confirmed(key);
        if (outcome !== null) this.accept(key, outcome);
        else if (key === 'schedule' && this.schedule.state() === 'draft') {
          const calendar = this.schedule.calendar();
          const core = this.metadata.core();
          if (calendar) {
            this.verifiedCalendar = calendar;
            this.global.calendar.set(calendar);
            if (core && !this.base.locked()) this.base.load(core, calendar);
          }
        }
        // A confirmed calendar draft still needs a new conscious Save to apply it.
        this.failed.set(null);
      }), catchError((error: unknown) => { this.error.set(error); return throwError(() => error); }),
      finalize(() => this.busy.set(false)));
    });
  }

  private writeSection(key: GlobalSaveSection): Observable<unknown> {
    return defer(() => {
      if (key === 'schedule' && this.schedule.state() === 'draft') { this.phase.set('apply'); return this.schedule.apply(); }
      const calendar = this.verifiedCalendar;
      this.phase.set('prepare');
      if (key === 'schedule' && calendar && calendar !== this.schedule.calendar()) this.schedule.acceptBaseReadback(calendar);
      if (key === 'dated' && calendar && calendar !== this.dated.calendar()) this.dated.acceptCalendarReadback(calendar);
      const prepare: Observable<unknown> = key === 'edition' ? this.metadata.acceptEditionReadback()
        : key === 'policy' && calendar?.calendarRevision !== this.policyCalendarRevision
        ? this.policy.acceptCalendarReadback().pipe(tap(() => { this.policyCalendarRevision = calendar?.calendarRevision ?? null; })) : of(null);
      return prepare.pipe(observeOn(asapScheduler), switchMap(() => this.previewSection(key)), switchMap(() => {
        this.phase.set('save');
        const write: Observable<unknown> = key === 'core' || key === 'edition' ? this.metadata.save(key)
          : key === 'base' && this.base.calendar() !== null && this.base.result() === 'unchanged' && !this.base.dirty()
            ? of(this.base.calendar()) : this[key].save();
        return write;
      }), observeOn(asapScheduler), switchMap(saved => {
        if (key !== 'schedule') return of(saved);
        if (this.schedule.state() !== 'draft') return throwError(() => new EventGlobalSaveError('unconfirmed'));
        this.phase.set('apply');
        return this.schedule.apply();
      }));
    });
  }

  private previewSection(key: GlobalSaveSection): Observable<boolean> {
    this.phase.set(key === 'core' || key === 'edition' ? 'check' : 'preview');
    if (key === 'core' || key === 'edition') return of(this.metadata.canSave(key));
    if (key === 'schedule' && this.schedule.state() === 'draft') return of(true);
    const preview: Observable<Pick<AdminGlobalCalendarPreview, 'valid'>> = this[key].previewChanges();
    return preview.pipe(map(result => result.valid), observeOn(asapScheduler), throwIfEmpty(() => new EventGlobalSaveError('empty')), tap(valid => {
      if (!valid) throw new EventGlobalSaveError('previewRejected');
    }));
  }

  private requireReady(key: GlobalSaveSection): void {
    if (key === 'base' && this.base.result() === 'unchanged' && !this.base.dirty()) return;
    if (key === 'core' || key === 'edition') {
      if (!this.metadata.canSave(key)) throw this.metadata.saveUnavailableError(key);
    } else if (key === 'schedule') {
      const applying = this.schedule.state() === 'draft';
      if (!(applying ? this.schedule.canApply() : this.schedule.canSave())) throw this.schedule.saveUnavailableError(applying);
    } else if (!this[key].canSave()) throw this[key].saveUnavailableError();
  }

  private confirmed(key: GlobalSaveSection): 'saved' | 'unchanged' | null {
    if (key === 'core' || key === 'edition') return this.metadata.state() === 'idle' && this.metadata.pendingTarget() === null ? 'saved' : null;
    if (key === 'base') return !this.base.readbackPending() && !this.base.dirty() ? this.base.result() : null;
    if (key === 'schedule') return this.schedule.state() === 'idle' && this.schedule.result() === 'applied' ? 'saved' : null;
    if (key === 'dated') return !this.dated.readbackPending() && !this.dated.isDirty() ? 'saved' : null;
    return this.policy.saved() && !this.policy.readbackPending() && !this.policy.dirty() ? 'saved' : null;
  }

  private accept(key: GlobalSaveSection, outcome = this.confirmed(key)): void {
    if (outcome === null) throw new EventGlobalSaveError('unconfirmed');
    const calendar = key === 'base' ? this.base.calendar() : key === 'schedule' ? this.schedule.calendar()
      : key === 'dated' ? this.dated.calendar() : null;
    if (calendar) {
      this.verifiedCalendar = calendar;
      this.global.calendar.set(calendar);
      const core = this.metadata.core();
      if (!this.dated.isDirty() && !this.dated.readbackPending()) this.dated.load(calendar);
      if (key === 'schedule' && core && !this.base.locked()) this.base.load(core, calendar);
    }
    this.baseline.update(values => ({ ...values, [key]: this.value(key) }));
    if (outcome === 'saved') this.completed.update(done => done.includes(key) ? done : [...done, key]);
  }

  private value(key: GlobalSaveSection): string {
    if (key === 'core') {
      const value = this.metadata.coreForm.getRawValue();
      return JSON.stringify([value.name.trim(), normalizeText(value.shortDescription), normalizeText(value.longDescription)]);
    }
    if (key === 'edition') {
      const value = this.metadata.editionForm.getRawValue();
      return JSON.stringify([normalizeText(value.venueName), normalizeText(value.venueAddress), normalizeText(value.facebookLink)]);
    }
    return JSON.stringify(this.forms[key].getRawValue());
  }

  private signature(): string {
    this.formEvents();
    return JSON.stringify(GLOBAL_SAVE_SECTIONS.map(key => [key, this.value(key), key === 'schedule' ? this.schedule.state() : null]));
  }
}
