import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import type { AbstractControl } from '@angular/forms';
import { asapScheduler, catchError, concatMap, defaultIfEmpty, defer, EMPTY, finalize, from, map, merge, Observable, observeOn, of, switchMap, takeWhile, tap, throwError, toArray } from 'rxjs';

import type { IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import type { AdminGlobalCalendarResult } from '../../../../core/interfaces/i-admin-global-event';
import type { GlobalSaveCheckReason } from '../../../../core/interfaces/i-event-global-saved-summary';
import { assertEdgeContract } from '../../../../core/utils/edge-contract';
import { normalizeText } from '../../../../core/utils/normalize-text';
import { EventCoreMetadataController } from './event-core-metadata-controller';
import { EventDatedBlocksController } from './event-dated-blocks-controller';
import { EventGlobalBaseTimeBlocksController } from './event-global-base-time-blocks-controller';
import { EventGlobalDraftController } from './event-global-draft-controller';
import { EventGlobalScheduleController } from './event-global-schedule-controller';
import { EventGlobalPolicyFacade } from './policy/event-global-policy-facade';
import { EventCoreCoverController } from './event-core-cover-controller';
import { EventManualProgramController } from './event-manual-program-controller';
import { EventGlobalPublicationController } from './event-global-publication-controller';

const sections = ['base', 'schedule', 'dated', 'policy', 'core', 'edition'] as const;
export type GlobalSaveSection = typeof sections[number];
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
  private readonly formEvents = toSignal(merge(...sections.map(key => this.forms[key].events)));
  private readonly baseline = signal<Partial<Record<GlobalSaveSection, string>>>({});
  private policyCalendarRevision: number | null = null;
  private verifiedCalendar: AdminGlobalCalendarResult | null = null;
  readonly busy = signal(false);
  readonly checking = signal(false);
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
    return sections.filter(key => key === 'schedule' && this.schedule.state() === 'draft' ||
      this.forms[key].dirty && (key === 'policy' ? this.policy.dirty() : key === 'dated' ? this.dated.hasChanges() : this.value(key) !== baseline[key]));
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
      const baseline = this.baseline();
      const changed = this.changed();
      untracked(() => {
        if (this.completed().some(key => changed.includes(key))) this.completed.update(done => done.filter(key => !changed.includes(key)));
        for (const key of sections) {
          if (baseline[key] !== undefined && this.forms[key].dirty && !changed.includes(key)) this.forms[key].markAsPristine();
        }
      });
    });
  }

  reset(): void {
    this.baseline.set({});
    this.policyCalendarRevision = null;
    this.verifiedCalendar = null;
    this.busy.set(false);
    this.checking.set(false);
    this.checkedSignature.set(null);
    this.completed.set([]);
    this.failed.set(null);
    this.error.set(null);
    this.checkIssue.set(null);
  }

  load(core: IEventCoreDetail): Observable<unknown> {
    const calendar = this.global.calendar();
    assertEdgeContract(calendar !== null && calendar.coreId === core.id, 'globalSave.load', 'the canonical Global calendar');
    this.verifiedCalendar = calendar;
    this.schedule.load(core, calendar);
    this.base.load(core, calendar);
    this.dated.load(calendar);
    return this.policy.load(core).pipe(tap(() => {
      this.policyCalendarRevision = calendar.calendarRevision;
      this.baseline.set(Object.fromEntries(sections.map(key => [key, this.value(key)])));
    }));
  }

  validate(): GlobalSaveSection | null {
    const changed = [...this.changed()].sort((a, b) => GLOBAL_SAVE_STEPS[a] - GLOBAL_SAVE_STEPS[b]);
    for (const key of changed) {
      if (key === 'schedule') this.schedule.validationAttempted.set(true);
      if (key === 'base') this.base.validationAttempted.set(true);
      if (key === 'dated') this.dated.validationAttempted.set(true);
      if (key === 'policy') this.policy.validationAttempted.set(true);
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
      const activeSection = sections.find(key => key === 'core' || key === 'edition' ? this.metadata.isBusy() : this[key].isBusy());
      const reason = this.busy() || activeSection ? 'busy' : this.pending() ? 'pending' : this.blockingReason() ??
        (externallyBlocked ? 'otherOperation' : !this.dirty() ? 'unchanged' : null);
      if (reason) {
        this.checkIssue.set({ reason, section: reason === 'pending' ? this.failed() : activeSection ?? null });
        return of(false);
      }
      this.checkedSignature.set(null);
      this.checkIssue.set(null);
      this.error.set(null);
      const invalid = this.validate();
      if (invalid) { this.failed.set(invalid); return of(false); }
      const changed = this.changed();
      const signature = this.signature();
      this.busy.set(true);
      this.checking.set(true);
      return from(changed).pipe(concatMap(key => {
        this.failed.set(key);
        const request: Observable<boolean> = key === 'base' ? this.base.previewChanges().pipe(map(preview => preview.valid))
          : key === 'schedule' ? this.schedule.state() === 'draft' ? of(this.schedule.canApply())
            : this.schedule.previewChanges().pipe(map(preview => preview.valid))
            : key === 'dated' ? this.dated.previewChanges().pipe(map(preview => preview.valid))
              : key === 'policy' ? this.policy.previewChanges().pipe(map(preview => preview.valid)) : of(this.metadata.canSave(key));
        return request.pipe(observeOn(asapScheduler), defaultIfEmpty(false), tap(valid => {
          if (!valid) this.checkIssue.set({ reason: 'section', section: key });
        }));
      }), takeWhile(valid => valid, true), toArray(), map(results => {
        if (results.some(valid => !valid)) return false;
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
      if (this.blocked() || this.busy() || this.pending() || !this.dirty() || !this.checked()) return EMPTY;
      const invalid = this.validate();
      if (invalid) { this.failed.set(invalid); return EMPTY; }
      this.busy.set(true);
      this.checkedSignature.set(null);
      this.error.set(null);
      this.checkIssue.set(null);
      return from(this.changed()).pipe(concatMap(key => {
        this.failed.set(key);
        // Existing controllers release their busy guards in finalize, before the next operation starts.
        return this.writeSection(key).pipe(observeOn(asapScheduler), defaultIfEmpty(null), tap(() => {
          assertEdgeContract(this.confirmed(key), 'globalSave.readback', `a confirmed ${key} section; no further writers after refusal or uncertainty`);
          this.accept(key);
        }));
      }), toArray(), map(() => { this.failed.set(null); }),
      catchError((error: unknown) => { this.error.set(error); return throwError(() => error); }),
      finalize(() => this.busy.set(false)));
    });
  }

  retryReadback(): Observable<void> {
    return defer(() => {
      const key = this.failed();
      if (!key || !this.pending() || this.busy()) return EMPTY;
      this.busy.set(true);
      this.error.set(null);
      this.checkIssue.set(null);
      const read: Observable<unknown> = key === 'core' || key === 'edition' ? this.metadata.save(key)
        : key === 'base' ? this.base.refresh() : key === 'schedule' ? this.schedule.refresh()
          : key === 'dated' ? this.dated.refresh() : this.policy.refresh();
      return read.pipe(observeOn(asapScheduler), defaultIfEmpty(null), map(() => {
        assertEdgeContract(!this.pending(), 'globalSave.retry', 'a resolved canonical readback without another writer');
        if (this.confirmed(key)) this.accept(key);
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
      if (key === 'core' || key === 'edition') return key === 'edition'
        ? this.metadata.acceptEditionReadback().pipe(switchMap(() => this.metadata.save(key))) : this.metadata.save(key);
      if (key === 'base') return this.base.previewChanges().pipe(observeOn(asapScheduler), switchMap(() =>
        this.base.canSave() ? this.base.save() : of(null)));
      if (key === 'schedule') {
        if (this.schedule.state() === 'draft') return this.schedule.apply();
        const calendar = this.verifiedCalendar;
        if (calendar && calendar !== this.schedule.calendar()) this.schedule.acceptBaseReadback(calendar);
        return this.schedule.previewChanges().pipe(observeOn(asapScheduler), switchMap(() => this.schedule.save()), observeOn(asapScheduler),
          switchMap(() => this.schedule.state() === 'draft' ? this.schedule.apply() : of(null)));
      }
      if (key === 'dated') {
        const calendar = this.verifiedCalendar;
        if (calendar && calendar !== this.dated.calendar()) this.dated.acceptCalendarReadback(calendar);
        return this.dated.previewChanges().pipe(observeOn(asapScheduler), switchMap(() => this.dated.save()));
      }
      const calendar = this.verifiedCalendar;
      const prepare: Observable<unknown> = calendar?.calendarRevision !== this.policyCalendarRevision
        ? this.policy.acceptCalendarReadback().pipe(tap(() => { this.policyCalendarRevision = calendar?.calendarRevision ?? null; })) : of(null);
      return prepare.pipe(observeOn(asapScheduler), switchMap(() => this.policy.previewChanges()), observeOn(asapScheduler),
        switchMap(() => this.policy.save()));
    });
  }

  private confirmed(key: GlobalSaveSection): boolean {
    if (key === 'core' || key === 'edition') return this.metadata.state() === 'idle' && !this.forms[key].dirty;
    if (key === 'base') return !this.base.readbackPending() && this.base.result() !== null && !this.base.dirty();
    if (key === 'schedule') return this.schedule.state() === 'idle' && this.schedule.result() === 'applied';
    if (key === 'dated') return !this.dated.readbackPending() && !this.dated.isDirty();
    return this.policy.saved() && !this.policy.readbackPending() && !this.policy.dirty();
  }

  private accept(key: GlobalSaveSection): void {
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
    this.completed.update(done => done.includes(key) ? done : [...done, key]);
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
    return JSON.stringify(sections.map(key => [key, this.value(key), key === 'schedule' ? this.schedule.state() : null]));
  }
}
