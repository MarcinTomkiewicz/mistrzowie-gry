import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, defer, EMPTY, finalize, forkJoin, map, Observable, of, switchMap, tap, throwError } from 'rxjs';

import { EventOccurrenceStatus } from '../../../../core/enums/event';
import { mapEventPolicyDocument, samePolicyDocument } from '../../../../core/factories/event-policy-form.factory';
import { GLOBAL_PUBLICATION_BLOCKER_CODES, type AdminGlobalPublicationOccurrence, type AdminGlobalPublicationPreview,
  type AdminGlobalPublicationResult } from '../../../../core/interfaces/i-admin-global-event-publication';
import type { IAdminEventDetail, IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import type { AdminGlobalCalendarResult } from '../../../../core/interfaces/i-admin-global-event';
import type { AdminEventPolicyDraft } from '../../../../core/interfaces/i-admin-event-policy';
import type { AdminEventTimeline } from '../../../../core/interfaces/i-admin-event-timeline';
import type { EventGlobalSavedSnapshot } from '../../../../core/interfaces/i-event-global-saved-summary';
import { EventRead } from '../../../../core/reads/events/event-read';
import { Auth } from '../../../../core/services/auth/auth';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { RpcError } from '../../../../core/types/rpc-error';
import { isValidIsoDate } from '../../../../core/utils/date';
import { assertEdgeContract, readEdgeObject, readEdgeUuid } from '../../../../core/utils/edge-contract';
import { EventGlobalDraftController } from './event-global-draft-controller';
import { readEventGlobalSavedSummary } from './event-global-saved-summary-state';

type PublicationContext = Pick<AdminGlobalPublicationResult, 'coreId' | 'mainEditionId'> & {
  snapshot: EventGlobalSavedSnapshot;
  readiness: AdminGlobalPublicationPreview;
};

@Injectable()
export class EventGlobalPublicationController {
  private readonly admin = inject(EventAdmin);
  private readonly auth = inject(Auth);
  private readonly global = inject(EventGlobalDraftController);
  private readonly publicRead = inject(EventRead);
  private prepared: PublicationContext | null = null;
  private readonly phase = signal<'idle' | 'preview' | 'confirm' | 'publish' | 'readback'>('idle');
  private readonly pending = signal<PublicationContext | null>(null);
  readonly preview = signal<AdminGlobalPublicationPreview | null>(null);
  readonly result = signal<AdminGlobalPublicationResult | null>(null);
  readonly verified = signal(false);
  readonly error = signal<unknown | null>(null);
  readonly isBusy = computed(() => this.phase() !== 'idle');
  readonly needsReadback = computed(() => this.pending() !== null);
  readonly locked = computed(() => this.isBusy() || this.needsReadback());

  reset(): void {
    this.prepared = null;
    this.phase.set('idle');
    this.pending.set(null);
    this.preview.set(null);
    this.result.set(null);
    this.verified.set(false);
    this.error.set(null);
  }

  prepare(coreId: string): Observable<AdminGlobalPublicationPreview> {
    return defer(() => {
      if (this.locked() || !this.auth.hasRole('admin')) return EMPTY;
      this.preview.set(null);
      this.result.set(null);
      this.verified.set(false);
      this.error.set(null);
      this.phase.set('preview');
      this.prepared = null;
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
          this.prepared = { coreId, mainEditionId: snapshot.calendar.mainEditionId, snapshot, readiness };
          this.phase.set('confirm');
          return readiness;
        }));
      })));
    });
  }

  cancelConfirmation(): void {
    if (this.phase() === 'confirm') { this.prepared = null; this.phase.set('idle'); }
  }

  publish(): Observable<IEventCoreDetail | null> {
    return defer(() => {
      const context = this.prepared;
      if (this.phase() !== 'confirm' || !context || !this.auth.hasRole('admin')) {
        this.cancelConfirmation();
        return EMPTY;
      }
      this.prepared = null;
      this.phase.set('publish');
      const write = this.admin.publishGlobalEvent(context.coreId, context.readiness.policyDraftRevision).pipe(tap(result => {
        this.assertResult(result, context);
        this.result.set(result);
        this.pending.set(context);
      }), catchError((error: unknown) => {
        this.error.set(error);
        this.preview.set(null);
        if (error instanceof RpcError && ['40001', '23514', '42501', '22023', '22P02', 'P0002'].includes(error.code)) {
          // A definite refusal is not a confirmed publication or a readback failure.
          this.pending.set(null);
          this.phase.set('preview');
          return this.readPreview(context.coreId).pipe(map(() => null));
        }
        // Transport or response-contract failures require reads, never an automatic writer retry.
        this.pending.set(context);
        return throwError(() => error);
      }));
      return this.run(write.pipe(switchMap(result => result === null ? of(null) : this.readSaved(context))));
    });
  }

  retryReadback(): Observable<IEventCoreDetail> {
    return defer(() => {
      const pending = this.pending();
      if (!pending || this.isBusy() || !this.auth.hasRole('admin')) return EMPTY;
      this.error.set(null);
      return this.run(this.readSaved(pending));
    });
  }

  private readPreview(coreId: string): Observable<AdminGlobalPublicationPreview> {
    return this.admin.previewGlobalPublication(coreId).pipe(tap(preview => {
      const impact = preview.impact;
      assertEdgeContract(preview.coreId === coreId && typeof preview.valid === 'boolean' && Array.isArray(preview.blockers) &&
        preview.status === (preview.valid ? 'draft_ready' : 'blocked') && preview.valid === (preview.blockers.length === 0) &&
        preview.published === false && preview.participantSignupOpened === false && preview.appliedToPublic === false &&
        [preview.policyDraftRevision, impact.affectedCityCount, impact.publishableOccurrenceCount,
          impact.preservedPastDraftOccurrences].every(value => Number.isInteger(value) && value >= 0) &&
        Array.isArray(impact.publishableOccurrences) && Array.isArray(impact.preservedPastDraftOccurrenceEntries) &&
        impact.publishableOccurrences.length === impact.publishableOccurrenceCount &&
        impact.preservedPastDraftOccurrenceEntries.length === impact.preservedPastDraftOccurrences &&
        (!preview.valid || (impact.publishableOccurrenceCount > 0 &&
          new Set(impact.publishableOccurrences.map(row => row.editionId)).size === impact.affectedCityCount)),
      'globalPublication.preview', 'the frozen read-only readiness result for the requested Core');
      this.indexOccurrences([...impact.publishableOccurrences, ...impact.preservedPastDraftOccurrenceEntries]);
      if (preview.policyDraftImpact !== null) readEdgeObject(preview.policyDraftImpact, 'globalPublication.policyDraftImpact');
      for (const blocker of preview.blockers) {
        assertEdgeContract(GLOBAL_PUBLICATION_BLOCKER_CODES.includes(blocker.code), 'globalPublication.blocker', 'a frozen readiness code');
        if (blocker.editionId !== undefined) readEdgeUuid(blocker.editionId, 'globalPublication.editionId');
        if (blocker.date !== undefined) assertEdgeContract(isValidIsoDate(blocker.date), 'globalPublication.date', 'a real ISO date');
        for (const value of [blocker.blockPosition, blocker.totalSlots]) {
          assertEdgeContract(value === undefined || (Number.isInteger(value) && value >= 0), 'globalPublication.block', 'an optional nonnegative integer');
        }
        for (const value of [blocker.fieldErrors, blocker.policyBlockers]) {
          assertEdgeContract(value === undefined || Array.isArray(value), 'globalPublication.policyIssues', 'an optional array');
        }
      }
      this.preview.set(preview);
    }));
  }

  private assertResult(result: AdminGlobalPublicationResult, context: PublicationContext): void {
    assertEdgeContract(result.coreId === context.coreId && result.mainEditionId === context.mainEditionId &&
      result.public === true && result.participantSignupOpened === false &&
      ((result.published === true && result.alreadyPublished === false) || (result.published === false && result.alreadyPublished === true)),
    'globalPublication.result', 'an explicit first publication or short idempotent result for the requested Core and main Edition');
    if (result.published) {
      const published = this.indexOccurrences(result.publishedOccurrences);
      const impact = context.readiness.impact;
      assertEdgeContract(result.editionCount === impact.affectedCityCount &&
        result.publishedOccurrenceCount === impact.publishableOccurrenceCount && published.size === impact.publishableOccurrenceCount &&
        result.policyDraftApplied === (context.readiness.policyDraftRevision > 0) && typeof result.globalSignupReleaseEnabled === 'boolean' &&
        impact.publishableOccurrences.every(entry => {
          const saved = published.get(entry.occurrenceId);
          return saved?.editionId === entry.editionId && saved.date === entry.date;
        }), 'globalPublication.first', 'the exact readiness identities, counts and separate policy/platform flags');
    }
  }

  private readSaved(context: PublicationContext): Observable<IEventCoreDetail> {
    this.phase.set('readback');
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
        this.assertPublishedScope(context, core, calendar, editions, timelines);
        this.assertAppliedPolicy(context, policyDraft);
        assertEdgeContract(page !== null && page.core.id === core.id && page.core.key === core.key &&
          page.defaultEventId === context.mainEditionId && page.editions.length === context.readiness.impact.affectedCityCount &&
          context.snapshot.calendar.cities.every(city => page.editions.some(row => row.id === city.editionId && row.slug === city.slug)),
        'globalPublication.publicRead', 'independent public visibility of the Core, default Edition and all published cities');
        this.pending.set(null);
        this.preview.set(null);
        this.verified.set(true);
        this.error.set(null);
        return core;
      }));
    }));
  }

  private assertPublishedScope(context: PublicationContext, core: IEventCoreDetail, calendar: AdminGlobalCalendarResult,
    editions: (IAdminEventDetail | null)[], timelines: AdminEventTimeline[]): void {
    const expected = context.snapshot.calendar;
    const linked = calendar.globalDates.flatMap(day => day.cityOccurrences.map(city => city.occurrenceId).filter(id => id !== null));
    assertEdgeContract(calendar.cities.length === expected.cities.length && core.editions.length === expected.cities.length &&
      editions.length === expected.cities.length && timelines.length === expected.cities.length &&
      new Set(linked).size === linked.length &&
      new Set(calendar.cities.map(city => city.editionId)).size === calendar.cities.length &&
      new Set(core.editions.map(city => city.id)).size === core.editions.length &&
      new Set(calendar.globalDates.map(day => day.globalOccurrenceId)).size === calendar.globalDates.length &&
      new Set(calendar.globalDates.map(day => day.date)).size === calendar.globalDates.length &&
      calendar.globalDates.length === expected.globalDates.length && expected.globalDates.every(day => {
        const saved = calendar.globalDates.find(row => row.globalOccurrenceId === day.globalOccurrenceId && row.date === day.date);
        return saved?.status === day.status && saved.cityOccurrences.length === day.cityOccurrences.length &&
          new Set(saved.cityOccurrences.map(city => city.editionId)).size === saved.cityOccurrences.length && day.cityOccurrences.every(city =>
          saved.cityOccurrences.some(row => row.editionId === city.editionId && row.occurrenceId === city.occurrenceId && row.decision === city.decision));
      }), 'globalPublication.calendarScope', 'the saved date and city participation identities captured with readiness');
    const impact = context.readiness.impact;
    const scope = this.indexOccurrences([...impact.publishableOccurrences, ...impact.preservedPastDraftOccurrenceEntries]);
    const released = new Set(impact.publishableOccurrences.map(row => row.occurrenceId));
    const seen = new Set<string>();
    for (const [index, city] of expected.cities.entries()) {
      const edition = editions[index];
      const timeline = timelines[index];
      assertEdgeContract(edition !== null && edition !== undefined && edition.id === city.editionId && edition.eventCoreId === core.id &&
        edition.slug === city.slug && edition.city === city.city && edition.timezone === city.timezone &&
        edition.isActive && edition.currentlyPublic && edition.isDefaultPublic === city.isMain &&
        timeline !== undefined && timeline.eventId === city.editionId && timeline.eventCoreId === core.id && timeline.timezone === city.timezone &&
        timeline.occurrences.length === edition.occurrences.length &&
        new Set(edition.occurrences.map(row => row.date)).size === edition.occurrences.length &&
        core.editions.some(row => row.id === city.editionId && row.isActive && row.isDefaultPublic === city.isMain) &&
        calendar.cities.some(row => row.editionId === city.editionId && row.city === city.city && row.slug === city.slug &&
          row.timezone === city.timezone && row.isActive && row.isMain === city.isMain),
      'globalPublication.city', 'each expected city independently read as a public Edition');
      for (const occurrence of edition.occurrences) {
        const entry = scope.get(occurrence.id);
        const published = released.has(occurrence.id);
        const status = published ? EventOccurrenceStatus.Published : EventOccurrenceStatus.Planned;
        const day = calendar.globalDates.find(row => row.date === occurrence.date);
        const local = day?.cityOccurrences.find(row => row.editionId === edition.id && row.occurrenceId === occurrence.id);
        const operational = timeline.occurrences.find(row => row.occurrenceId === occurrence.id && row.date === occurrence.date);
        assertEdgeContract(!seen.has(occurrence.id) &&
          (entry === undefined || (entry.editionId === edition.id && entry.date === occurrence.date && local !== undefined)) &&
          occurrence.status === status && operational?.status === status && operational.participantSignupOpenedAt === null &&
          (local === undefined || (local.occurrenceStatus === status && local.publishedAt === occurrence.publishedAt)) &&
          (published ? occurrence.publishedAt !== null && Number.isFinite(Date.parse(occurrence.publishedAt)) &&
            day?.status === 'scheduled' && local?.decision === 'included' : occurrence.publishedAt === null),
        'globalPublication.occurrence', 'the same server-selected identity in Calendar, Edition and Timeline, with its exact status and no participant signup history');
        seen.add(occurrence.id);
      }
    }
    assertEdgeContract([...scope.keys()].every(id => seen.has(id)),
      'globalPublication.scopeReadback', 'every publishable and preserved identity returned by readiness');
  }

  private indexOccurrences(entries: AdminGlobalPublicationOccurrence[]): Map<string, AdminGlobalPublicationOccurrence> {
    assertEdgeContract(Array.isArray(entries), 'globalPublication.identities', 'the server-supplied identity array');
    for (const entry of entries) {
      readEdgeObject(entry, 'globalPublication.identity');
      readEdgeUuid(entry.editionId, 'globalPublication.editionId');
      readEdgeUuid(entry.occurrenceId, 'globalPublication.occurrenceId');
      assertEdgeContract(isValidIsoDate(entry.date), 'globalPublication.date', 'a real ISO date');
    }
    const index = new Map(entries.map(entry => [entry.occurrenceId, entry]));
    assertEdgeContract(index.size === entries.length && new Set(entries.map(entry => `${entry.editionId}:${entry.date}`)).size === entries.length,
      'globalPublication.identities', 'unique occurrence IDs and Edition/date pairs across the whole scope');
    return index;
  }

  private assertAppliedPolicy(context: PublicationContext, draft: AdminEventPolicyDraft): void {
    const policy = this.global.policy();
    const result = this.result();
    assertEdgeContract(draft.coreId === context.coreId && !draft.hasDraft && policy !== null &&
      policy.coreId === context.coreId && policy.mainEditionId === context.mainEditionId &&
      draft.canonicalBaseline.coreId === context.coreId && draft.canonicalBaseline.mainEditionId === context.mainEditionId &&
      (!result?.published || result.policyDraftApplied === (context.readiness.policyDraftRevision > 0)),
    'globalPublication.policyApplication', 'the consumed expected policy draft and consistent first-publication application flag');
    const expected = mapEventPolicyDocument(context.snapshot.policyDraft);
    assertEdgeContract(samePolicyDocument(expected, mapEventPolicyDocument(draft)) &&
      samePolicyDocument(expected, mapEventPolicyDocument({ ...draft, canonicalBaseline: policy })),
    'globalPublication.effectivePolicy', 'all expected global values and city overrides applied in the canonical effective policy');
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
