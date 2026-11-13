import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, concatMap, defer, EMPTY, finalize, forkJoin, from, map, Observable, of, switchMap, tap, throwError, toArray } from 'rxjs';

import { EventOccurrenceStatus, ParticipantSignupKind } from '../../../../core/enums/event';
import type { AdminGlobalPublicationOccurrence, AdminGlobalPublicationPreview, AdminGlobalPublicationResult, AdminGlobalScopePublicationPreview,
  AdminGlobalScopePublicationResult, EventGlobalScopePublicationCommand, GlobalPublicationSignupProgress } from '../../../../core/interfaces/i-admin-global-event-publication';
import type { IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import type { AdminGlobalCalendarResult } from '../../../../core/interfaces/i-admin-global-event';
import type { EventGlobalSavedSnapshot } from '../../../../core/interfaces/i-event-global-saved-summary';
import { assertFirstAppliedPolicy, assertFirstPublishedScope, assertGlobalPublicationPreview, assertGlobalPublicationResult,
  type FirstGlobalPublicationContext } from '../../../../core/reads/events/admin-global-publication.contract';
import { EventRead } from '../../../../core/reads/events/event-read';
import { assertScopeCalendar, assertScopeReadinessSnapshot, assertScopedPublicationReadback,
  readGlobalScopePublicationSnapshot, type GlobalScopePublicationContext } from '../../../../core/reads/events/admin-global-scope-publication-read';
import { Auth } from '../../../../core/services/auth/auth';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { EventParticipant } from '../../../../core/services/event-participant/event-participant';
import { RpcError } from '../../../../core/types/rpc-error';
import { assertEdgeContract } from '../../../../core/utils/edge-contract';
import { EventGlobalDraftController } from './event-global-draft-controller';
import { readEventGlobalSavedSummary, selectGlobalSignupRecovery } from './event-global-saved-summary-read';

type PublicationContext = ({ kind: 'first' } & FirstGlobalPublicationContext) | GlobalScopePublicationContext;
type PendingPublication = PublicationContext | { kind: 'signup'; coreId: string };

@Injectable()
export class EventGlobalPublicationController {
  private readonly admin = inject(EventAdmin);
  private readonly auth = inject(Auth);
  private readonly global = inject(EventGlobalDraftController);
  private readonly publicRead = inject(EventRead);
  private readonly participant = inject(EventParticipant);
  private publicationActorId: string | null = null;
  private confirmedCore: IEventCoreDetail | null = null;
  private prepared: PublicationContext | null = null;
  private readonly phase = signal<'idle' | 'preview' | 'confirm' | 'publish' | 'readback' | 'opening'>('idle');
  private readonly pending = signal<PendingPublication | null>(null);
  readonly preview = signal<AdminGlobalPublicationPreview | null>(null);
  readonly result = signal<AdminGlobalPublicationResult | null>(null);
  readonly scopeCalendar = signal<AdminGlobalCalendarResult | null>(null);
  readonly scopePreview = signal<AdminGlobalScopePublicationPreview | null>(null);
  readonly scopeResult = signal<AdminGlobalScopePublicationResult | null>(null);
  readonly scopeReadbackAbandoned = signal(false);
  readonly scopeConfirmable = computed(() => this.phase() === 'confirm' && this.scopePreview()?.valid === true);
  readonly verified = signal(false);
  readonly publicationConfirmed = signal(false);
  readonly signupProgress = signal<readonly GlobalPublicationSignupProgress[]>([]);
  readonly error = signal<unknown | null>(null);
  readonly isBusy = computed(() => this.phase() !== 'idle');
  readonly needsReadback = computed(() => this.pending() !== null);
  readonly canAbandonScopeReadback = computed(() => this.pending()?.kind === 'scope' && !this.isBusy() &&
    !this.publicationConfirmed() && this.error() !== null && this.auth.hasRole('admin'));
  readonly locked = computed(() => this.isBusy() || this.needsReadback());

  reset(): void {
    this.prepared = null;
    this.phase.set('idle');
    this.pending.set(null);
    this.preview.set(null);
    this.result.set(null);
    this.scopeCalendar.set(null);
    this.scopePreview.set(null);
    this.scopeResult.set(null);
    this.scopeReadbackAbandoned.set(false);
    this.verified.set(false);
    this.error.set(null);
    this.clearSignupProgress();
  }

  prepare(coreId: string): Observable<AdminGlobalPublicationPreview> {
    return defer(() => {
      if (this.locked() || !this.auth.hasRole('admin')) return EMPTY;
      this.preview.set(null);
      this.result.set(null);
      this.scopePreview.set(null);
      this.scopeResult.set(null);
      this.verified.set(false);
      this.error.set(null);
      this.phase.set('preview');
      this.prepared = null;
      this.clearSignupProgress();
      return this.run(this.readPreview(coreId).pipe(switchMap(readiness => {
        if (!readiness.valid) return of(readiness);
        return readEventGlobalSavedSummary(this.admin, coreId).pipe(map(snapshot => {
          const impact = readiness.impact;
          assertEdgeContract(impact.affectedCityCount === snapshot.calendar.cities.length &&
            snapshot.calendar.cities.every(city => impact.publishableOccurrences.some(row => row.editionId === city.editionId)) &&
            !snapshot.core.isActive && !snapshot.core.hasPublicPage && snapshot.calendar.pendingDraft === null &&
            readiness.policyDraftRevision === snapshot.policyDraft.revision && !snapshot.policyDraft.baselineChanged &&
            [...impact.publishableOccurrences, ...impact.preservedPastDraftOccurrenceEntries].every(entry => {
              const day = snapshot.calendar.globalDates.find(row => row.date === entry.date);
              const local = day?.cityOccurrences.find(row => row.editionId === entry.editionId && row.occurrenceId === entry.occurrenceId);
              return day?.status === 'scheduled' && local?.decision === 'included' && !local.unlinkedSameDate &&
                local.occurrenceStatus === EventOccurrenceStatus.Planned && local.publishedAt === null;
            }), 'globalPublication.scope', 'the exact server-selected planned identities and policy draft in the fresh saved snapshot');
          this.prepared = { kind: 'first', coreId, mainEditionId: snapshot.calendar.mainEditionId, snapshot, readiness };
          this.phase.set('confirm');
          return readiness;
        }));
      })));
    });
  }

  prepareScope(coreId: string, editionIds: string[], globalDateIds: string[]): Observable<AdminGlobalScopePublicationPreview> {
    return defer(() => {
      if (this.locked() || !this.auth.hasRole('admin')) return EMPTY;
      this.invalidateScope();
      this.preview.set(null);
      this.phase.set('preview');
      return this.run(this.readScopePreview(coreId, [...editionIds], [...globalDateIds]).pipe(switchMap(({ command, readiness }) => {
        if (!readiness.valid) return of(readiness);
        return readGlobalScopePublicationSnapshot(this.admin, command).pipe(map(snapshot => {
          const context: GlobalScopePublicationContext = { kind: 'scope', command, readiness, snapshot };
          assertScopeReadinessSnapshot(context);
          this.prepared = context;
          this.phase.set('confirm');
          return readiness;
        }));
      })));
    });
  }

  invalidateScope(): void {
    if (this.locked()) return;
    this.prepared = null;
    this.scopePreview.set(null);
    this.scopeResult.set(null);
    this.scopeReadbackAbandoned.set(false);
    this.result.set(null);
    this.verified.set(false);
    this.error.set(null);
    this.clearSignupProgress();
  }

  cancelConfirmation(): void {
    if (this.phase() === 'confirm') { this.prepared = null; this.phase.set('idle'); }
  }

  publish(): Observable<IEventCoreDetail | null> {
    return defer(() => {
      const context = this.prepared;
      if (this.phase() !== 'confirm' || !context || this.auth.userId() === null || !this.auth.hasRole('admin')) {
        this.cancelConfirmation();
        return EMPTY;
      }
      this.prepared = null;
      this.phase.set('publish');
      this.publicationActorId = this.auth.userId();
      const command: Observable<unknown> = context.kind === 'scope'
        ? this.admin.publishGlobalScope(context.command).pipe(tap(result => this.scopeResult.set(result)))
        : this.admin.publishGlobalEvent(context.coreId, context.readiness.policyDraftRevision).pipe(tap(result => {
          assertGlobalPublicationResult(result, context);
          this.result.set(result);
        }));
      const write = command.pipe(map(() => {
        this.pending.set(context);
        return true;
      }), catchError((error: unknown) => {
        this.error.set(error);
        this.preview.set(null);
        this.scopePreview.set(null);
        if (error instanceof RpcError && ['40001', '23514', '42501', '22023', '22P02', 'P0002'].includes(error.code)) {
          // A definite refusal is not a confirmed publication or a readback failure.
          this.pending.set(null);
          this.phase.set('preview');
          const refresh: Observable<unknown> = context.kind === 'scope'
            ? this.readScopePreview(context.command.coreId, context.command.editionIds, context.command.globalDateIds)
            : this.readPreview(context.coreId);
          return refresh.pipe(map(() => false));
        }
        // Transport or response-contract failures require reads, never an automatic writer retry.
        this.pending.set(context);
        return throwError(() => error);
      }));
      return this.run(write.pipe(switchMap(accepted => accepted ? this.continuePublication(context) : of(null))));
    });
  }

  retryReadback(): Observable<IEventCoreDetail> {
    return defer(() => {
      const pending = this.pending();
      if (!pending || this.isBusy() || !this.auth.hasRole('admin')) return EMPTY;
      this.error.set(null);
      return this.run(this.continuePublication(pending));
    });
  }

  restoreSignup(snapshot: EventGlobalSavedSnapshot): Observable<void> {
    return defer(() => {
      const actorId = this.auth.userId();
      const cities = snapshot.cities.filter(entry => entry.city.isActive);
      if (this.locked() || this.verified() || actorId === null || !this.auth.hasRole('admin') || !cities.length ||
        snapshot.core.archived || !snapshot.core.isActive || !snapshot.core.hasPublicPage || snapshot.edition.isStaffingConverted) return of(undefined);
      this.phase.set('readback');
      return this.run(forkJoin(cities.map(({ city }) => this.participant.getPublicAvailability(city.editionId)
        .pipe(map(items => [city.editionId, items] as const)))).pipe(map(entries => {
        assertEdgeContract(this.auth.userId() === actorId && this.auth.hasRole('admin'),
          'publication.signup.recovery.actor', 'the administrator who requested this readback');
        const occurrences = selectGlobalSignupRecovery(snapshot, new Map(entries), Date.now());
        if (!occurrences.length) return;
        this.publicationActorId = actorId;
        this.scopeCalendar.set(snapshot.calendar);
        this.acceptReadback(snapshot.core, occurrences);
        this.pending.set({ kind: 'signup', coreId: snapshot.core.id });
      })));
    });
  }

  abandonScopeReadback(): boolean {
    if (!this.canAbandonScopeReadback()) return false;
    this.pending.set(null);
    this.prepared = null;
    this.scopePreview.set(null);
    this.scopeResult.set(null);
    this.verified.set(false);
    this.error.set(null);
    this.scopeReadbackAbandoned.set(true);
    return true;
  }

  private readPreview(coreId: string): Observable<AdminGlobalPublicationPreview> {
    return this.admin.previewGlobalPublication(coreId).pipe(tap(preview => {
      assertGlobalPublicationPreview(preview, coreId);
      this.preview.set(preview);
    }));
  }

  private readScopePreview(coreId: string, editionIds: string[], globalDateIds: string[]) {
    return this.admin.getGlobalCalendar(coreId).pipe(switchMap(calendar => {
      assertScopeCalendar(calendar, coreId);
      this.scopeCalendar.set(calendar);
      const command: EventGlobalScopePublicationCommand = { coreId, expectedCalendarRevision: calendar.calendarRevision, editionIds, globalDateIds };
      return this.admin.previewGlobalScopePublication(command).pipe(map(readiness => {
        this.scopePreview.set(readiness);
        return { command, readiness };
      }));
    }));
  }

  private readSaved(context: PublicationContext): Observable<IEventCoreDetail> {
    this.phase.set('readback');
    if (context.kind === 'first') return this.readFirstSaved(context);
    return readGlobalScopePublicationSnapshot(this.admin, context.command).pipe(map(snapshot => {
      const newlyPublished = assertScopedPublicationReadback(context, snapshot, this.scopeResult());
      this.scopeCalendar.set(snapshot.calendar);
      this.global.calendar.set(snapshot.calendar);
      this.global.policy.set(snapshot.policy);
      for (const edition of snapshot.editions) {
        if (edition.id === this.global.mainEdition()?.id) this.global.mainEdition.set(edition);
        if (edition.id === this.global.selectedEditionId()) this.global.selectedEdition.set(edition);
      }
      return this.acceptReadback(snapshot.core, newlyPublished);
    }));
  }

  private readFirstSaved(context: FirstGlobalPublicationContext): Observable<IEventCoreDetail> {
    return this.global.readCore(context.coreId).pipe(switchMap(core => {
      const calendar = this.global.calendar();
      const edition = this.global.mainEdition();
      assertEdgeContract(core !== null && core.id === context.coreId && core.key === context.snapshot.core.key && core.isActive && core.hasPublicPage &&
        calendar?.coreId === core.id && calendar.coreKey === core.key &&
        calendar.calendarLifecycle === 'global' && calendar.mainEditionId === context.mainEditionId &&
        edition?.id === context.mainEditionId && edition.eventCoreId === core.id &&
        edition.isActive && edition.isDefaultPublic && edition.currentlyPublic,
      'globalPublication.readback', 'the actual public Core and public default main Edition');
      return forkJoin({
        editions: forkJoin(context.snapshot.calendar.cities.map(city => city.isMain ? of(edition) : this.admin.getEditionDetail(city.editionId))),
        timelines: forkJoin(context.snapshot.calendar.cities.map(city => this.admin.getTimeline(city.editionId))),
        policyDraft: this.admin.getPolicyDraft(core.id),
        page: this.publicRead.getPublicPage(core.key),
      }).pipe(map(({ editions, timelines, policyDraft, page }) => {
        assertFirstPublishedScope(context, core, calendar, editions, timelines);
        assertFirstAppliedPolicy(context, policyDraft, this.global.policy(), this.result());
        assertEdgeContract(page !== null && page.core.id === core.id && page.core.key === core.key &&
          page.defaultEventId === context.mainEditionId && page.editions.length === context.readiness.impact.affectedCityCount &&
          context.snapshot.calendar.cities.every(city => page.editions.some(row => row.id === city.editionId && row.slug === city.slug)),
        'globalPublication.publicRead', 'independent public visibility of the Core, default Edition and all published cities');
        return this.acceptReadback(core, context.readiness.impact.publishableOccurrences);
      }));
    }));
  }

  private acceptReadback(core: IEventCoreDetail, occurrences: readonly AdminGlobalPublicationOccurrence[]): IEventCoreDetail {
    this.assertActor();
    assertEdgeContract(new Set(occurrences.map(row => row.occurrenceId)).size === occurrences.length,
      'publication.signup', 'the exact unique newly published local identities, including an empty scoped release');
    this.confirmedCore = core;
    this.publicationConfirmed.set(true);
    this.signupProgress.set(occurrences.map(row => ({ ...row, state: 'pending' })));
    this.preview.set(null);
    this.scopePreview.set(null);
    this.error.set(null);
    return core;
  }

  private continuePublication(context: PendingPublication): Observable<IEventCoreDetail> {
    this.assertActor();
    const publication = this.confirmedCore !== null ? of(this.confirmedCore)
      : context.kind !== 'signup' ? this.readSaved(context)
      : throwError(() => new Error('Recovered signup requires a confirmed public Core.'));
    return publication.pipe(switchMap(core => {
      this.phase.set('opening');
      return from(this.signupProgress().filter(row => row.state !== 'confirmed')).pipe(
        concatMap(row => this.openOccurrence(row, core.id)), toArray(),
        switchMap(() => this.global.readCore(core.id)),
        map(current => {
          this.assertActor();
          this.signupProgress.update(rows => rows.map(row => row.state === 'confirmed' &&
            !this.global.calendar()?.globalDates.some(day => day.date === row.date && day.cityOccurrences.some(local =>
              local.editionId === row.editionId && local.occurrenceId === row.occurrenceId &&
              local.occurrenceStatus === EventOccurrenceStatus.ParticipantSignupOpen && local.publishedAt !== null))
            ? { ...row, state: 'failed' } : row));
          assertEdgeContract(current !== null && current.id === core.id && current.isActive && current.hasPublicPage &&
            this.signupProgress().every(row => row.state === 'confirmed'),
          'publication.signup.readback', 'the public Core and every eligible opening confirmed');
          this.pending.set(null);
          this.verified.set(true);
          this.error.set(null);
          return current;
        }),
      );
    }));
  }

  private openOccurrence(row: GlobalPublicationSignupProgress, coreId: string): Observable<void> {
    const setState = (state: GlobalPublicationSignupProgress['state']) => this.signupProgress.update(rows =>
      rows.map(item => item.occurrenceId === row.occurrenceId ? { ...item, state } : item));
    const read = () => defer(() => {
      this.assertActor();
      return forkJoin({ edition: this.admin.getEditionDetail(row.editionId), availability: this.participant.getPublicAvailability(row.editionId) });
    }).pipe(map(({ edition, availability }) => {
      this.assertActor();
      const occurrence = edition?.occurrences.find(item => item.id === row.occurrenceId && item.date === row.date);
      assertEdgeContract(edition?.eventCoreId === coreId && edition.id === row.editionId && edition.isActive &&
        edition.currentlyPublic && !edition.isStaffingConverted && occurrence !== undefined &&
        occurrence.publishedAt !== null && occurrence.capacityPolicy === 'independent' &&
        [EventOccurrenceStatus.Published, EventOccurrenceStatus.ParticipantSignupOpen].includes(occurrence.status),
      'publication.signup.scope', 'the same published local Occurrence in its canonical Edition');
      return { occurrence, items: availability.filter(item => item.occurrenceId === row.occurrenceId) };
    }));
    return defer(() => {
      setState('pending');
      return read().pipe(switchMap(before => {
        if (before.occurrence.status === EventOccurrenceStatus.ParticipantSignupOpen) return of(before);
        assertEdgeContract(before.occurrence.participantSignupOpenedAt === null,
          'publication.signup.history', 'a never-opened occurrence; previously opened or deliberately closed signup is preserved');
        this.assertActor();
        return this.admin.openSignup(row.occurrenceId).pipe(switchMap(() => read()));
      }), map(after => {
        const qualifyingScopes = after.items.filter(item => item.availabilityStatus !== 'unavailable' &&
          (after.occurrence.participantSignupKind === ParticipantSignupKind.Both || item.scope === after.occurrence.participantSignupKind));
        assertEdgeContract(after.occurrence.status === EventOccurrenceStatus.ParticipantSignupOpen &&
          after.occurrence.participantSignupOpenedAt !== null && Number.isFinite(Date.parse(after.occurrence.participantSignupOpenedAt)) &&
          qualifyingScopes.every(item => !['not_open', 'closed', 'release_disabled'].includes(item.availabilityStatus)),
        'publication.signup.readback', 'the persisted signup opening and independently refreshed public availability');
        setState('confirmed');
      }), catchError((error: unknown) => { setState('failed'); return throwError(() => error); }));
    });
  }

  private clearSignupProgress(): void {
    this.confirmedCore = null;
    this.publicationActorId = null;
    this.publicationConfirmed.set(false);
    this.signupProgress.set([]);
  }

  private assertActor(): void {
    assertEdgeContract(this.publicationActorId !== null && this.auth.userId() === this.publicationActorId && this.auth.hasRole('admin'),
      'publication.actor', 'the administrator who started this operation');
  }

  private run<T>(request: Observable<T>): Observable<T> {
    return request.pipe(catchError((error: unknown) => {
      this.error.set(error);
      return throwError(() => error);
    }), finalize(() => {
      if (this.phase() !== 'confirm') this.phase.set('idle');
    }));
  }
}
