import {
  DestroyRef, Injectable, TransferState, afterNextRender, effect, inject,
  makeStateKey, signal, untracked, type StateKey,
} from '@angular/core';
import { defer, finalize, Observable, Subscription, tap, timer } from 'rxjs';

import type { IEventParticipantAvailability } from '../../../core/interfaces/i-event-participant';
import { Auth } from '../../../core/services/auth/auth';
import { EventParticipant } from '../../../core/services/event-participant/event-participant';
import { Platform } from '../../../core/services/platform/platform';
import type { PublicEventConfirmedEntry } from '../../../core/types/public-event-program';
import { parseIsoDate } from '../../../core/utils/date';
import { parseTimeLabelToMinutes } from '../../../core/utils/time-format';
import { timeZoneDateToTimestamp } from '../../../core/utils/time-zone';
import { EventPageFacade } from './event-page-facade';

type AvailabilityState =
  | { kind: 'idle' | 'loading' | 'error' }
  | { kind: 'ready'; eventId: string; items: IEventParticipantAvailability[] };

@Injectable()
export class EventParticipantAvailability {
  private readonly page = inject(EventPageFacade);
  private readonly participant = inject(EventParticipant);
  private readonly auth = inject(Auth);
  private readonly platform = inject(Platform);
  private readonly transferState = inject(TransferState);
  private request: Subscription | null = null;
  private readOwner: object | null = null;
  private readonly availabilityState = signal<AvailabilityState>({ kind: 'idle' });
  private readonly clock = signal(Date.now());
  private readonly clientReady = signal(false);
  readonly state = this.availabilityState.asReadonly();

  constructor() {
    afterNextRender(() => this.clientReady.set(true));
    effect((onCleanup) => {
      const page = this.page.state();
      untracked(() => {
        this.readOwner = null;
        if (page.kind === 'ready') this.load(page.edition.id, true);
        else this.availabilityState.set({ kind: 'idle' });
      });
      onCleanup(() => this.request?.unsubscribe());
    });
    effect((onCleanup) => {
      const page = this.page.state();
      const entries = this.page.selectedProgram();
      const now = this.clock();
      if (!this.clientReady() || page.kind !== 'ready') return;
      const nextStart = Math.min(...entries.flatMap((entry) => {
        const startsAt = entry.kind === 'confirmed' && entry.session !== null ? this.sessionStartAt(entry, page.edition.timezone) : null;
        return startsAt !== null && startsAt > now ? [startsAt] : [];
      }));
      if (!Number.isFinite(nextStart)) return;
      const request = timer(Math.min(nextStart - now, 2_147_483_647))
        .subscribe(() => { this.clock.set(Date.now()); this.refresh(); });
      onCleanup(() => request.unsubscribe());
    });
    inject(DestroyRef).onDestroy(() => this.request?.unsubscribe());
  }

  forProgramItem(programItemId: string | null): IEventParticipantAvailability | null {
    const page = this.page.state();
    const availability = this.state();
    const occurrence = this.page.selectedOccurrence();
    if (!this.clientReady() || !this.auth.isReady() ||
      page.kind !== 'ready' ||
      availability.kind !== 'ready' || availability.eventId !== page.edition.id || !occurrence) return null;

    const entry = this.page.selectedProgram().find((item) =>
      item.kind === 'confirmed' && item.programItemId === programItemId,
    );
    if (!entry || entry.kind !== 'confirmed' || entry.session === null || entry.occurrenceId !== occurrence.id) return null;
    const item = availability.items.find((item) =>
      item.scope === 'program_item' && item.programItemId === entry.programItemId && item.occurrenceId === entry.occurrenceId,
    );
    return item ?? null;
  }

  forWholeEvent(): IEventParticipantAvailability | null {
    const page = this.page.state();
    const availability = this.state();
    const occurrence = this.page.selectedOccurrence();
    if (!this.clientReady() || !this.auth.isReady() || page.kind !== 'ready' ||
      availability.kind !== 'ready' || availability.eventId !== page.edition.id || !occurrence) return null;
    return availability.items.find(item => item.scope === 'whole_event' && item.occurrenceId === occurrence.id) ?? null;
  }

  refresh(): void {
    const page = this.page.state();
    if (page.kind === 'ready' && this.state().kind !== 'loading') {
      this.load(page.edition.id, false);
    }
  }

  refreshForEdition(eventId: string): Observable<IEventParticipantAvailability[]> {
    return defer(() => {
      const page = this.page.state();
      const owner = {};
      if (page.kind === 'ready' && page.edition.id === eventId) {
        this.request?.unsubscribe();
        this.readOwner = owner;
        this.availabilityState.set({ kind: 'loading' });
      }
      return this.participant.getPublicAvailability(eventId).pipe(tap({
        next: items => {
          if (this.readOwner === owner) this.availabilityState.set({ kind: 'ready', eventId, items });
        },
        error: () => {
          if (this.readOwner === owner) this.availabilityState.set({ kind: 'error' });
        },
      }), finalize(() => {
        // Cancellation must not leave public signup permanently in a loading state.
        if (this.readOwner === owner && this.state().kind === 'loading') this.availabilityState.set({ kind: 'error' });
      }));
    });
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

  private load(eventId: string, hydrate: boolean): void {
    this.request?.unsubscribe();
    const owner = this.readOwner = {};
    const key = makeStateKey<AvailabilityState>(`public-event-participant-availability:${eventId}`);
    if (hydrate && this.platform.isBrowser && this.transferState.hasKey(key)) {
      this.availabilityState.set(this.transferState.get(key, { kind: 'error' }));
      this.transferState.remove(key);
      return;
    }
    this.availabilityState.set({ kind: 'loading' });
    this.request = this.participant.getPublicAvailability(eventId).subscribe({
      next: (items) => { if (this.readOwner === owner) this.setState({ kind: 'ready', eventId, items }, key); },
      error: () => { if (this.readOwner === owner) this.setState({ kind: 'error' }, key); },
    });
  }

  private setState(state: AvailabilityState, key: StateKey<AvailabilityState>): void {
    this.availabilityState.set(state);
    if (!this.platform.isBrowser) this.transferState.set(key, state);
  }
}
