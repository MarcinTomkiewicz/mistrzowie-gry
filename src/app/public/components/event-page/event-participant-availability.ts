import {
  Injectable, TransferState, afterNextRender, computed, effect, inject,
  makeStateKey, signal, untracked,
} from '@angular/core';
import { AsyncSubject, EMPTY, finalize, map, Observable, of, Subscription, tap, timer } from 'rxjs';

import type { EventParticipantSignupTarget, IEventParticipantAvailability } from '../../../core/interfaces/i-event-participant';
import { Auth } from '../../../core/services/auth/auth';
import { EventParticipant } from '../../../core/services/event-participant/event-participant';
import { Platform } from '../../../core/services/platform/platform';
import type { PublicEventConfirmedEntry } from '../../../core/types/public-event-program';
import { parseIsoDate } from '../../../core/utils/date';
import { assertEdgeContract } from '../../../core/utils/edge-contract';
import { parseTimeLabelToMinutes } from '../../../core/utils/time-format';
import { timeZoneDateToTimestamp } from '../../../core/utils/time-zone';
import { EventPageFacade } from './event-page-facade';

type AvailabilityState =
  | { kind: 'idle' | 'loading' }
  | { kind: 'error'; cause: unknown }
  | { kind: 'ready'; eventId: string; items: IEventParticipantAvailability[] };

@Injectable()
export class EventParticipantAvailability {
  private readonly page = inject(EventPageFacade);
  private readonly participant = inject(EventParticipant);
  private readonly auth = inject(Auth);
  private readonly platform = inject(Platform);
  private readonly transferState = inject(TransferState);
  private request: Subscription | null = null;
  private readonly availabilityState = signal<AvailabilityState>({ kind: 'idle' });
  private readonly clientReadyState = signal(false);
  readonly clientReady = this.clientReadyState.asReadonly();
  readonly state = this.availabilityState.asReadonly();
  readonly isLoading = computed(() => {
    const page = this.page.state();
    const availability = this.state();
    return !this.clientReady() || availability.kind !== 'error' &&
      (!this.auth.isReady() || page.kind !== 'ready' || availability.kind !== 'ready' || availability.eventId !== page.edition.id);
  });

  constructor() {
    afterNextRender(() => this.clientReadyState.set(true));
    effect((onCleanup) => {
      const page = this.page.state();
      const actorReady = this.auth.isReady();
      const authError = this.auth.loadError();
      this.auth.userId();
      untracked(() => {
        this.availabilityState.set(authError ? { kind: 'error', cause: authError } : { kind: 'idle' });
        if (page.kind === 'ready' && actorReady) this.refresh();
      });
      onCleanup(() => this.request?.unsubscribe());
    });
    effect((onCleanup) => {
      const page = this.page.state();
      const entries = this.page.selectedProgram();
      const now = Date.now();
      if (!this.clientReady() || page.kind !== 'ready' || this.state().kind !== 'ready') return;
      const nextStart = Math.min(...entries.flatMap((entry) => {
        const startsAt = entry.kind === 'confirmed' && entry.session !== null ? this.sessionStartAt(entry, page.edition.timezone) : null;
        return startsAt !== null && startsAt > now ? [startsAt] : [];
      }));
      if (!Number.isFinite(nextStart)) return;
      const request = timer(Math.min(nextStart - now, 2_147_483_647))
        .subscribe(() => this.refresh());
      onCleanup(() => request.unsubscribe());
    });
  }

  forTarget(target: EventParticipantSignupTarget): IEventParticipantAvailability | null {
    const availability = this.state();
    const occurrence = this.page.selectedOccurrence();
    if (this.isLoading() || availability.kind !== 'ready' || !occurrence) return null;
    if (target.scope === 'whole_event' && target.occurrenceId !== occurrence.id) return null;
    if (target.scope === 'program_item' && !this.page.selectedProgram().some(entry =>
      entry.kind === 'confirmed' && entry.session !== null && entry.timeScope === 'timed' &&
      entry.programItemId === target.programItemId && entry.occurrenceId === occurrence.id)) return null;
    return availability.items.find(item => item.scope === target.scope && item.occurrenceId === occurrence.id &&
      (target.scope === 'whole_event' || item.programItemId === target.programItemId)) ?? null;
  }

  refresh(eventId?: string): Observable<IEventParticipantAvailability[]> {
    const page = this.page.state();
    if (this.auth.loadError()) {
      this.auth.loadUser().subscribe({ error: () => undefined });
      return EMPTY;
    }
    if (page.kind !== 'ready' || !this.auth.isReady() || eventId !== undefined && page.edition.id !== eventId) return EMPTY;
    this.request?.unsubscribe();
    this.availabilityState.set({ kind: 'loading' });
    const actorId = this.auth.userId();
    const key = makeStateKey<IEventParticipantAvailability[] | null>(`public-event-participant-availability:${page.edition.id}`);
    const cached = this.platform.isBrowser && actorId === null ? this.transferState.get(key, null) : null;
    this.transferState.remove(key);
    // Readback observes the accepted result; only this service owns the GET subscription.
    const result = new AsyncSubject<IEventParticipantAvailability[]>();
    this.request = (cached ? of(cached) : this.participant.getPublicAvailability(page.edition.id)).pipe(
      map(items => {
        assertEdgeContract(this.page.state() === page && this.auth.isReady() && this.auth.userId() === actorId,
          'participantAvailability.actorScope', 'the same actor and Edition after the authoritative read');
        this.availabilityState.set({ kind: 'ready', eventId: page.edition.id, items });
        if (!this.platform.isBrowser && actorId === null) this.transferState.set(key, items);
        return items;
      }),
      tap({ error: (cause: unknown) => this.availabilityState.set({ kind: 'error', cause }) }),
      finalize(() => result.complete()),
    ).subscribe(result);
    return result.asObservable();
  }

  private sessionStartAt(entry: PublicEventConfirmedEntry, timezone: string): number | null {
    const date = parseIsoDate(entry.occurrenceDate);
    const minutes = parseTimeLabelToMinutes(entry.slot.startTime);
    if (!date || minutes === null) return null;
    date.setDate(date.getDate() + (entry.slot.startDayOffset ?? 0));
    date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    const timestamp = timeZoneDateToTimestamp(date, timezone);
    return timestamp === null ? null : Date.parse(timestamp);
  }
}
