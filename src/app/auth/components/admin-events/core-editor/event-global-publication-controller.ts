import { computed, inject, Injectable, linkedSignal, signal } from '@angular/core';
import { catchError, concatMap, defer, EMPTY, finalize, forkJoin, from, map, Observable, of, switchMap, tap, throwError, toArray } from 'rxjs';

import { EventOccurrenceStatus, EventProgramItemStatus } from '../../../../core/enums/event';
import type { AdminGlobalPublicationOccurrence, AdminGlobalPublicationPreview, AdminGlobalPublicationResult, AdminGlobalScopePublicationPreview,
  AdminGlobalScopePublicationResult, EventGlobalScopePublicationCommand, GlobalPublicationOccurrenceProgress,
  GlobalPublicationStep, GlobalPublicationStepProgress, GlobalPublicationSignupReadback } from '../../../../core/interfaces/i-admin-global-event-publication';
import type { ManualTimelineRow } from '../../../../core/interfaces/i-admin-event-timeline';
import type { IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import type { EventGlobalSavedSnapshot } from '../../../../core/interfaces/i-event-global-saved-summary';
import { assertGlobalPublicationPreview, assertGlobalPublicationResult, assertGlobalPublishedProgram, assertPublishedManualProgram, readGlobalProgramOccurrence,
  classifyGlobalSignupAvailability, EventGlobalSignupAvailabilityError,
  type FirstGlobalPublicationContext } from '../../../../core/reads/events/admin-global-publication.contract';
import { EventRead } from '../../../../core/reads/events/event-read';
import { EventProgramRead } from '../../../../core/reads/events/event-program-read';
import { assertScopeCalendar, assertScopeReadinessSnapshot, assertScopedPublicationReadback, assertPublishedMarkers,
  readFirstGlobalPublicationSnapshot, readGlobalScopePublicationSnapshot, type GlobalScopePublicationContext } from '../../../../core/reads/events/admin-global-scope-publication-read';
import { Auth } from '../../../../core/services/auth/auth';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { EventParticipant } from '../../../../core/services/event-participant/event-participant';
import { assertEdgeContract } from '../../../../core/utils/edge-contract';
import { isDefiniteEventAdminRpcRejection } from '../event-admin-errors';
import { readEventGlobalSavedSummary, selectGlobalProgramRecovery, selectGlobalSignupRecovery } from './event-global-saved-summary-read';

type PublicationContext = ({ kind: 'first' } & FirstGlobalPublicationContext) | GlobalScopePublicationContext;
type PendingPublication = PublicationContext | { kind: 'release' | 'recovery'; coreId: string };

@Injectable()
export class EventGlobalPublicationController {
  private readonly admin = inject(EventAdmin);
  private readonly auth = inject(Auth);
  private readonly publicRead = inject(EventRead);
  private readonly programRead = inject(EventProgramRead);
  private readonly participant = inject(EventParticipant);
  private publicationActorId: string | null = null;
  readonly confirmedCore = signal<IEventCoreDetail | null>(null);
  readonly snapshot = signal<EventGlobalSavedSnapshot | null>(null);
  private readonly prepared = signal<PublicationContext | null>(null);
  private readonly busy = signal(false);
  private readonly pending = signal<PendingPublication | null>(null);
  readonly preview = signal<AdminGlobalPublicationPreview | null>(null);
  readonly result = signal<AdminGlobalPublicationResult | null>(null);
  readonly scopeCalendar = linkedSignal(() => this.snapshot()?.calendar ?? null);
  readonly scopePreview = signal<AdminGlobalScopePublicationPreview | null>(null);
  readonly scopeResult = signal<AdminGlobalScopePublicationResult | null>(null);
  readonly scopeReadbackAbandoned = signal(false);
  readonly scopeConfirmable = computed(() => this.prepared()?.kind === 'scope');
  readonly verified = computed(() => this.publicationConfirmed() && !this.needsReadback() && this.occurrenceProgress().every(row =>
    row.program.state === 'confirmed' && ['confirmed', 'not_required'].includes(row.signup.state)));
  readonly publicationConfirmed = computed(() => this.confirmedCore() !== null);
  readonly occurrenceProgress = signal<readonly GlobalPublicationOccurrenceProgress[]>([]);
  readonly error = signal<unknown | null>(null);
  readonly isBusy = computed(() => this.busy() || this.prepared() !== null);
  readonly needsReadback = computed(() => this.pending() !== null);
  readonly needsRecovery = computed(() => this.pending()?.kind === 'recovery');
  readonly canAbandonScopeReadback = computed(() => this.pending()?.kind === 'scope' && !this.isBusy() &&
    !this.publicationConfirmed() && this.error() !== null && this.auth.hasRole('admin'));
  readonly locked = computed(() => this.isBusy() || this.needsReadback());
  readonly resultUncertain = computed(() => this.occurrenceProgress().some(row =>
    (['publication', 'program', 'signup'] as const).some(step => row[step].state === 'uncertain')) ||
    this.needsReadback() && this.error() !== null && !isDefiniteEventAdminRpcRejection(this.error()));

  reset(): void {
    this.busy.set(false);
    this.pending.set(null);
    this.invalidateScope();
    this.snapshot.set(null);
  }

  prepare(coreId: string): Observable<AdminGlobalPublicationPreview> {
    return defer(() => {
      if (this.locked() || !this.auth.hasRole('admin')) return EMPTY;
      this.invalidateScope();
      return this.run(this.admin.previewGlobalPublication(coreId).pipe(switchMap(readiness =>
        (readiness.valid ? this.readSnapshot(coreId) : of(null)).pipe(map(snapshot => {
          assertGlobalPublicationPreview(readiness, coreId, snapshot);
          this.preview.set(readiness);
          if (readiness.valid && snapshot) this.prepared.set({ kind: 'first', coreId,
            mainEditionId: snapshot.calendar.mainEditionId, snapshot, readiness });
          return readiness;
        })))));
    });
  }

  prepareScope(coreId: string, editionIds: string[], globalDateIds: string[]): Observable<AdminGlobalScopePublicationPreview> {
    return defer(() => {
      if (this.locked() || !this.auth.hasRole('admin')) return EMPTY;
      this.invalidateScope();
      return this.run(this.admin.getGlobalCalendar(coreId).pipe(switchMap(calendar => {
        assertScopeCalendar(calendar, coreId);
        this.scopeCalendar.set(calendar);
        const command: EventGlobalScopePublicationCommand = { coreId, expectedCalendarRevision: calendar.calendarRevision,
          editionIds: [...editionIds], globalDateIds: [...globalDateIds] };
        return this.admin.previewGlobalScopePublication(command).pipe(tap(readiness => this.scopePreview.set(readiness)), switchMap(readiness => {
          if (!readiness.valid) return of(readiness);
          return readGlobalScopePublicationSnapshot(this.admin, command, calendar).pipe(map(snapshot => {
            const context: GlobalScopePublicationContext = { kind: 'scope', command, readiness, snapshot };
            assertScopeReadinessSnapshot(context);
            this.prepared.set(context);
            return readiness;
          }));
        }));
      })));
    });
  }

  invalidateScope(): void {
    if (this.busy() || this.needsReadback()) return;
    this.prepared.set(null);
    this.preview.set(null);
    this.scopePreview.set(null);
    this.scopeResult.set(null);
    this.scopeReadbackAbandoned.set(false);
    this.result.set(null);
    this.error.set(null);
    this.confirmedCore.set(null);
    this.publicationActorId = this.auth.userId();
    this.occurrenceProgress.set([]);
  }

  cancelConfirmation(): void {
    this.prepared.set(null);
  }

  publish(): Observable<IEventCoreDetail | null> {
    return defer(() => {
      const context = this.prepared();
      if (this.busy() || !context || this.auth.userId() === null || !this.auth.hasRole('admin')) {
        this.cancelConfirmation();
        return EMPTY;
      }
      this.prepared.set(null);
      this.preview.set(null);
      this.scopePreview.set(null);
      this.publicationActorId = this.auth.userId();
      const targets = context.kind === 'first' ? context.readiness.impact.publishableOccurrences
        : context.snapshot.calendar.globalDates.filter(day => context.command.globalDateIds.includes(day.globalOccurrenceId))
          .flatMap(day => day.cityOccurrences.filter(local => context.command.editionIds.includes(local.editionId) &&
            local.decision === 'included' && local.occurrenceStatus === EventOccurrenceStatus.Planned && local.occurrenceId !== null)
            .flatMap(local => local.occurrenceId === null ? [] : [{ editionId: local.editionId, occurrenceId: local.occurrenceId, date: day.date }]));
      this.setOccurrences(targets, 'running');
      this.pending.set(context);
      const command: Observable<unknown> = context.kind === 'scope'
        ? this.admin.publishGlobalScope(context.command).pipe(tap(result => this.scopeResult.set(result)))
        : this.admin.publishGlobalEvent(context.coreId, context.readiness.policyDraftRevision).pipe(tap(result => {
          assertGlobalPublicationResult(result, context);
          this.result.set(result);
        }));
      return this.run(command.pipe(catchError((error: unknown) => {
        if (isDefiniteEventAdminRpcRejection(error)) {
          this.pending.set(null);
          this.setOccurrences(targets, 'rejected', error);
        }
        return throwError(() => error);
      }), switchMap(() => this.continuePublication(context))),
        context.kind === 'scope' ? context.command.coreId : context.coreId);
    });
  }

  retryReadback(occurrenceId?: string): Observable<IEventCoreDetail> {
    return defer(() => {
      const pending = this.pending();
      if (!pending || this.isBusy() || !this.auth.hasRole('admin')) return EMPTY;
      if (occurrenceId !== undefined && (!this.publicationConfirmed() ||
        !this.occurrenceProgress().some(row => row.occurrenceId === occurrenceId))) return EMPTY;
      this.assertActor();
      if (pending.kind === 'recovery') {
        return this.recover(pending.coreId, true).pipe(map(snapshot => {
          assertEdgeContract(snapshot !== null, 'publication.recovery', 'the saved Core');
          return snapshot.core;
        }));
      }
      return this.run(this.continuePublication(pending, occurrenceId), pending.kind === 'scope' ? pending.command.coreId : pending.coreId);
    });
  }

  recover(coreId: string, resume = false): Observable<EventGlobalSavedSnapshot | null> {
    return defer(() => {
      if (!resume) this.invalidateScope();
      this.assertActor();
      if (!resume) this.snapshot.set(null);
      this.pending.set({ kind: 'recovery', coreId });
      return this.run(this.readSnapshot(coreId).pipe(switchMap(snapshot => {
        if (!snapshot || snapshot.core.archived || !snapshot.core.isActive || !snapshot.core.hasPublicPage) {
          this.pending.set(null);
          return of(snapshot);
        }
        const cities = snapshot.cities.filter(entry => entry.city.isActive);
        return (cities.length ? forkJoin(cities.map(({ city }) => this.participant.getPublicAvailability(city.editionId)
          .pipe(map(items => [city.editionId, items] as const)))) : of([])).pipe(switchMap(entries => {
          this.assertActor();
          const occurrences = new Map([...selectGlobalProgramRecovery(snapshot), ...selectGlobalSignupRecovery(
            snapshot.calendar, snapshot.cities.map(city => city.timeline), new Map(entries), Date.now())]
            .map(row => [row.occurrenceId, row]));
          const pending = occurrences.size ? { kind: 'release', coreId } as const : null;
          this.pending.set(pending);
          if (!pending) return of(snapshot);
          this.acceptReadback(snapshot.core, [...occurrences.values()]);
          return resume ? this.continuePublication(pending).pipe(map(() => this.snapshot())) : of(snapshot);
        }));
      })));
    });
  }

  readSnapshot(coreId: string): Observable<EventGlobalSavedSnapshot | null> {
    return defer(() => {
      this.assertActor();
      return readEventGlobalSavedSummary(this.admin, coreId);
    }).pipe(tap(snapshot => { this.assertActor(); this.snapshot.set(snapshot); }));
  }

  abandonScopeReadback(): boolean {
    if (!this.canAbandonScopeReadback()) return false;
    this.pending.set(null);
    this.error.set(null);
    this.scopeReadbackAbandoned.set(true);
    return true;
  }

  private readSaved(context: PublicationContext): Observable<IEventCoreDetail> {
    const read = context.kind === 'first' ? readFirstGlobalPublicationSnapshot(this.admin, this.publicRead, context, this.result())
      : readGlobalScopePublicationSnapshot(this.admin, context.command);
    return read.pipe(map(snapshot => {
      const newlyPublished = context.kind === 'first' ? context.readiness.impact.publishableOccurrences
        : assertScopedPublicationReadback(context, snapshot, this.scopeResult());
      this.scopeCalendar.set(snapshot.calendar);
      return this.acceptReadback(snapshot.core, newlyPublished);
    }));
  }

  private acceptReadback(core: IEventCoreDetail, occurrences: readonly AdminGlobalPublicationOccurrence[]): IEventCoreDetail {
    this.assertActor();
    this.confirmedCore.set(core);
    this.setOccurrences(occurrences, 'confirmed');
    return core;
  }

  private continuePublication(context: PendingPublication, occurrenceId?: string): Observable<IEventCoreDetail> {
    this.assertActor();
    const confirmedCore = this.confirmedCore();
    const publication = confirmedCore !== null ? of(confirmedCore)
      : context.kind === 'first' || context.kind === 'scope' ? this.readSaved(context)
      : throwError(() => new Error('Recovered signup requires a confirmed public Core.'));
    return publication.pipe(switchMap(core =>
      from(this.occurrenceProgress().filter(row => occurrenceId === undefined || row.occurrenceId === occurrenceId)).pipe(
        concatMap(row => (row.program.state === 'confirmed' ? of(undefined) : this.releaseProgram(row, core.id)).pipe(switchMap(() =>
          row.signup.state === 'confirmed' || row.signup.state === 'not_required' ? of(undefined) : this.openOccurrence(row, core.id)))), toArray(),
        switchMap(() => this.readSnapshot(core.id)),
        map(snapshot => {
          assertEdgeContract(snapshot !== null, 'publication.readback', 'the saved Core');
          this.occurrenceProgress.update(rows => rows.map(row => row.signup.state === 'confirmed' &&
            !snapshot.calendar.globalDates.some(day => day.date === row.date && day.cityOccurrences.some(local =>
              local.editionId === row.editionId && local.occurrenceId === row.occurrenceId &&
              local.occurrenceStatus === EventOccurrenceStatus.ParticipantSignupOpen && local.publishedAt !== null))
            ? { ...row, signup: { ...row.signup, state: 'uncertain', error: null } } : row));
          const complete = (row: GlobalPublicationOccurrenceProgress) => row.program.state === 'confirmed' &&
            (row.signup.state === 'confirmed' || row.signup.state === 'not_required');
          assertEdgeContract(snapshot.core.id === core.id && snapshot.core.isActive && snapshot.core.hasPublicPage &&
            this.occurrenceProgress().filter(row => occurrenceId === undefined || row.occurrenceId === occurrenceId).every(complete),
          'publication.signup.readback', 'the public Core and every eligible opening confirmed');
          if (this.occurrenceProgress().every(complete)) this.pending.set(null);
          return snapshot.core;
        }),
      )));
  }

  private releaseProgram(target: GlobalPublicationOccurrenceProgress, coreId: string): Observable<void> {
    const read = () => defer(() => {
      this.assertActor();
      return forkJoin({ timeline: this.admin.getTimeline(target.editionId),
        program: this.programRead.getPublicProgram(target.editionId, target.occurrenceId) });
    }).pipe(map(data => {
      this.assertActor();
      const occurrence = readGlobalProgramOccurrence(coreId, target, data.timeline, data.program.entries);
      return { ...data, occurrence };
    }));
    return this.releaseStep(target, 'program', stage =>
      read().pipe(switchMap(before => from(before.occurrence.rows.filter((row): row is ManualTimelineRow =>
        row.source === 'manual' && row.programStatus === EventProgramItemStatus.Approved)).pipe(
        concatMap(expected => defer(() => {
          const row = before.occurrence.rows.find(row => row.source === 'manual' && row.slotId === expected.slotId);
          assertEdgeContract(row?.source === 'manual' && row.programItemId === expected.programItemId &&
            row.activity?.kindKey === expected.activity?.kindKey, 'publication.program.slot', 'the unchanged requested Manual slot and programme identity');
          if (row.programStatus === EventProgramItemStatus.Published) {
            assertPublishedManualProgram(row, before.program.entries);
            return of(undefined);
          }
          assertEdgeContract(row.programStatus === EventProgramItemStatus.Approved &&
            [EventOccurrenceStatus.Published, EventOccurrenceStatus.ParticipantSignupClosed].includes(before.occurrence.status),
          'publication.program.ready', 'an approved item in a published or signup-closed Occurrence; the backend enforces participant history');
          stage('write');
          const write: Observable<unknown> = row.activity !== null
            ? this.admin.publishManualActivity(row.slotId, target.occurrenceId, row.activity.kindKey)
            : this.admin.publishManualRpgSlot(row.slotId, target.occurrenceId, row.programItemId);
          return write.pipe(switchMap(() => {
            stage('readback');
            return read().pipe(map(after => {
              const saved = after.occurrence.rows.find(item => item.source === 'manual' && item.slotId === row.slotId && item.programItemId === row.programItemId);
              assertEdgeContract(saved?.source === 'manual', 'publication.program.saved', 'the same published Manual slot');
              assertPublishedManualProgram(saved, after.program.entries);
              before = after;
            }));
          }));
        })), toArray(), map(() => before),
      )), map(after => {
        assertGlobalPublishedProgram(coreId, target, after.timeline, after.program.entries);
        this.setStep(target, 'program', 'confirmed');
      })));
  }

  private openOccurrence(row: GlobalPublicationOccurrenceProgress, coreId: string): Observable<void> {
    const read = () => defer(() => {
      this.assertActor();
      return forkJoin({ edition: this.admin.getEditionDetail(row.editionId), availability: this.participant.getPublicAvailability(row.editionId),
        timeline: this.admin.getTimeline(row.editionId), program: this.programRead.getPublicProgram(row.editionId, row.occurrenceId) });
    }).pipe(map(({ edition, availability, timeline, program }) => {
      this.assertActor();
      const occurrence = edition?.occurrences.find(item => item.id === row.occurrenceId && item.date === row.date);
      assertEdgeContract(edition?.eventCoreId === coreId && edition.id === row.editionId && edition.isActive &&
        edition.currentlyPublic && occurrence !== undefined && occurrence.capacityPolicy === 'independent',
      'publication.signup.scope', 'the same published local Occurrence in its canonical Edition');
      assertPublishedMarkers(occurrence);
      assertGlobalPublishedProgram(coreId, row, timeline, program.entries);
      return { occurrence, timeline, items: availability.filter(item => item.occurrenceId === row.occurrenceId) };
    }));
    return this.releaseStep(row, 'signup', stage => {
      let availability: GlobalPublicationSignupReadback | undefined;
      const setState = (state: GlobalPublicationStepProgress['state'], error: unknown | null = null) =>
        this.setStep(row, 'signup', state, error, availability);
      return read().pipe(switchMap(before => {
        if (before.occurrence.status === EventOccurrenceStatus.ParticipantSignupOpen) { stage('readback'); return of(before); }
        availability = classifyGlobalSignupAvailability(row.occurrenceId, before.occurrence.participantSignupKind, before.items);
        setState('running');
        const closed = before.occurrence.status === EventOccurrenceStatus.ParticipantSignupClosed || before.occurrence.participantSignupOpenedAt !== null;
        const calendar = this.scopeCalendar();
        assertEdgeContract(calendar?.coreId === coreId, 'publication.signup.calendar', 'the confirmed publication calendar');
        const eligible = !closed && selectGlobalSignupRecovery(calendar, [before.timeline], new Map([[row.editionId, before.items]]), Date.now())
          .some(item => item.occurrenceId === row.occurrenceId);
        if (!eligible) {
          if (!closed && availability.outcome !== 'no_scope' && availability.outcome !== 'past') throw new EventGlobalSignupAvailabilityError(availability);
          setState('not_required');
          return of(null);
        }
        stage('write');
        return this.admin.openSignup(row.occurrenceId).pipe(switchMap(() => { stage('readback'); return read(); }));
      }), map(after => {
        if (after === null) return;
        availability = classifyGlobalSignupAvailability(row.occurrenceId, after.occurrence.participantSignupKind, after.items);
        setState('running');
        assertEdgeContract(after.occurrence.status === EventOccurrenceStatus.ParticipantSignupOpen,
        'publication.signup.readback', 'the persisted signup opening');
        if (availability.outcome === 'no_scope' || availability.outcome === 'denied') throw new EventGlobalSignupAvailabilityError(availability);
        setState(availability.outcome === 'past' ? 'not_required' : 'confirmed');
      }));
    });
  }

  private releaseStep<T>(row: AdminGlobalPublicationOccurrence, step: 'program' | 'signup',
    request: (stage: (next: 'write' | 'readback') => void) => Observable<T>): Observable<T> {
    return defer(() => {
      let stage: 'read' | 'write' | 'readback' = 'read';
      this.setStep(row, step, 'running');
      return request(next => { this.assertActor(); stage = next; }).pipe(catchError((error: unknown) => {
        this.setStep(row, step, stage === 'write' && isDefiniteEventAdminRpcRejection(error) ? 'rejected'
          : stage === 'read' ? 'not_started' : 'uncertain', error);
        return throwError(() => error);
      }));
    });
  }

  private setOccurrences(occurrences: readonly AdminGlobalPublicationOccurrence[], state: GlobalPublicationStepProgress['state'], error: unknown | null = null): void {
    this.occurrenceProgress.set(occurrences.map(row => ({ ...row, publication: { state, error },
      program: { state: 'not_started', error: null }, signup: { state: 'not_started', error: null } })));
  }

  private setStep(row: AdminGlobalPublicationOccurrence, step: GlobalPublicationStep,
    state: GlobalPublicationStepProgress['state'], error: unknown | null = null, availability?: GlobalPublicationSignupReadback): void {
    this.occurrenceProgress.update(rows => rows.map(item => item.occurrenceId === row.occurrenceId
      ? { ...item, [step]: { state, error, availability: availability ?? item[step].availability } } : item));
  }

  private assertActor(): void {
    assertEdgeContract(this.publicationActorId !== null && this.auth.userId() === this.publicationActorId && this.auth.hasRole('admin'),
      'publication.actor', 'the administrator who started this operation');
  }

  private run<T>(request: Observable<T>, coreId?: string): Observable<T> {
    this.error.set(null);
    this.busy.set(true);
    return request.pipe(catchError((error: unknown) => {
      this.error.set(error);
      if (this.pending() && !this.publicationConfirmed()) {
        for (const row of this.occurrenceProgress()) this.setStep(row, 'publication', 'uncertain', error);
      }
      return coreId ? this.readSnapshot(coreId).pipe(
        catchError(() => throwError(() => error)), switchMap(() => throwError(() => error))) : throwError(() => error);
    }), finalize(() => this.busy.set(false)));
  }
}
