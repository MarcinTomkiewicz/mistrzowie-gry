import {
  DestroyRef, Injectable, TransferState, afterNextRender, computed, effect, inject, makeStateKey,
  signal, untracked, type StateKey,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, finalize, timer } from 'rxjs';

import { PUBLIC_EVENT_PARTICIPANT_SIGNUP_ENABLED } from '../../../core/configs/events.config';
import { ParticipantSignupKind } from '../../../core/enums/event';
import type {
  IEventParticipantAvailability, IEventParticipantGuestIdentity, IEventParticipantRegisterRequest,
  IEventParticipantRegisterResult,
} from '../../../core/interfaces/i-event-participant';
import { Auth } from '../../../core/services/auth/auth';
import { EventParticipant } from '../../../core/services/event-participant/event-participant';
import { Platform } from '../../../core/services/platform/platform';
import type { PublicEventConfirmedEntry } from '../../../core/types/public-event-program';
import { parseIsoDate } from '../../../core/utils/date';
import { isValidTime, parseTimeLabelToMinutes } from '../../../core/utils/time-format';
import { timeZoneDateToTimestamp } from '../../../core/utils/time-zone';
import { EventPageFacade } from './event-page-facade';

type AvailabilityState =
  | { kind: 'idle' | 'loading' | 'error' }
  | { kind: 'ready'; eventId: string; items: IEventParticipantAvailability[] };

type SignupSelection = {
  entry: PublicEventConfirmedEntry;
  eventId: string;
  actorId: string | null;
};

@Injectable()
export class EventParticipantSignupFacade {
  private readonly page = inject(EventPageFacade);
  private readonly participant = inject(EventParticipant);
  private readonly auth = inject(Auth);
  private readonly platform = inject(Platform);
  private readonly transferState = inject(TransferState);
  private readonly destroyRef = inject(DestroyRef);
  private availabilityRequest: Subscription | null = null;
  private readonly availabilityState = signal<AvailabilityState>({ kind: 'idle' });
  private readonly selection = signal<SignupSelection | null>(null);
  private readonly submitting = signal(false);
  private readonly registrationResult = signal<IEventParticipantRegisterResult | null>(null);
  private readonly uncertainProgramItemIds = signal<ReadonlySet<string>>(new Set());
  private readonly clock = signal(Date.now());
  private readonly clientReady = signal(false);

  readonly released = PUBLIC_EVENT_PARTICIPANT_SIGNUP_ENABLED;
  readonly availability = this.availabilityState.asReadonly();
  readonly isSubmitting = this.submitting.asReadonly();
  // Mutation results, including the guest receipt, stay only in this client instance.
  readonly result = this.registrationResult.asReadonly();
  readonly hasUncertainResults = computed(() => this.uncertainProgramItemIds().size > 0);
  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly accountName = this.auth.displayName;
  readonly selected = computed(() => {
    const selection = this.selection();
    const page = this.page.state();
    if (!selection || !this.auth.isReady() || page.kind !== 'ready' ||
      selection.eventId !== page.edition.id || selection.actorId !== this.auth.userId() ||
      selection.entry.occurrenceId !== this.page.selectedOccurrence()?.id) return null;

    return this.page.selectedProgram().find((entry): entry is PublicEventConfirmedEntry =>
      entry.kind === 'confirmed' && entry.programItemId === selection.entry.programItemId,
    ) ?? null;
  });
  readonly canSubmit = computed(() => {
    const entry = this.selected();
    return !!entry && !this.isSubmitting() && !this.result() && !this.hasUncertainResult(entry.programItemId) &&
      this.availabilityFor(entry.programItemId)?.canSignup === true;
  });
  readonly requestFailed = computed(() => this.hasUncertainResult(this.selected()?.programItemId ?? null));

  constructor() {
    afterNextRender(() => this.clientReady.set(true));
    effect((onCleanup) => {
      const page = this.page.state();
      untracked(() => {
        this.selection.set(null);
        if (page.kind === 'ready') this.loadAvailability(page.edition.id, true);
        else this.availabilityState.set({ kind: 'idle' });
      });
      onCleanup(() => this.availabilityRequest?.unsubscribe());
    });
    effect(() => {
      this.page.selectedOccurrence();
      this.auth.userId();
      this.auth.isReady();
      untracked(() => this.selection.set(null));
    });
    effect((onCleanup) => {
      const page = this.page.state();
      const entries = this.page.selectedProgram();
      const now = this.clock();
      if (!this.released || !this.clientReady() || page.kind !== 'ready') return;

      const nextStart = Math.min(...entries.flatMap((entry) => {
        const startsAt = entry.kind === 'confirmed' ? this.sessionStartAt(entry, page.edition.timezone) : null;
        return startsAt !== null && startsAt > now ? [startsAt] : [];
      }));
      if (!Number.isFinite(nextStart)) return;
      // Expire past-session CTAs without polling the backend; respect the native timer limit.
      const request = timer(Math.min(nextStart - now, 2_147_483_647))
        .subscribe(() => this.clock.set(Date.now()));
      onCleanup(() => request.unsubscribe());
    });
    this.destroyRef.onDestroy(() => this.availabilityRequest?.unsubscribe());
  }

  availabilityFor(programItemId: string | null): IEventParticipantAvailability | null {
    const page = this.page.state();
    const availability = this.availability();
    const occurrence = this.page.selectedOccurrence();
    if (!this.released || !this.clientReady() || !this.auth.isReady() || page.kind !== 'ready' ||
      page.edition.participantSignupKind !== ParticipantSignupKind.ProgramItem ||
      availability.kind !== 'ready' || availability.eventId !== page.edition.id || !occurrence) return null;

    const entry = this.page.selectedProgram().find((item) =>
      item.kind === 'confirmed' && item.programItemId === programItemId,
    );
    if (!entry || entry.kind !== 'confirmed' || entry.status !== 'confirmed' ||
      entry.occurrenceDate !== occurrence.occurrenceDate ||
      !isValidTime(entry.slot.startTime) || !isValidTime(entry.slot.endTime) ||
      entry.slot.endTime <= entry.slot.startTime ||
      !Number.isInteger(entry.session.maxPlayers) || (entry.session.maxPlayers ?? 0) <= 0) return null;

    const startsAt = this.sessionStartAt(entry, page.edition.timezone);
    if (startsAt === null || startsAt <= Math.max(this.clock(), Date.now())) return null;

    const item = availability.items.find((item) =>
      item.programItemId === entry.programItemId && item.occurrenceId === entry.occurrenceId,
    );
    // Null means signup is closed, never an unlimited or inferred number of seats.
    return item && item.remainingSeats !== null ? item : null;
  }

  hasUncertainResult(programItemId: string | null): boolean {
    return programItemId !== null && this.uncertainProgramItemIds().has(programItemId);
  }

  open(programItemId: string | null): void {
    const page = this.page.state();
    if (!this.platform.isBrowser || this.isSubmitting() || this.hasUncertainResult(programItemId) ||
      page.kind !== 'ready' || !this.availabilityFor(programItemId)?.canSignup) return;

    const entry = this.page.selectedProgram().find((item): item is PublicEventConfirmedEntry =>
      item.kind === 'confirmed' && item.programItemId === programItemId,
    );
    if (!entry) return;
    this.registrationResult.set(null);
    this.selection.set({ entry, eventId: page.edition.id, actorId: this.auth.userId() });
  }

  close(): void {
    if (!this.isSubmitting()) this.selection.set(null);
  }

  register(guest: IEventParticipantGuestIdentity): void {
    const entry = this.selected();
    const page = this.page.state();
    // Recheck the current route, actor, deadline and advisory gate at the last moment.
    if (!this.platform.isBrowser || !entry || page.kind !== 'ready' ||
      !this.canSubmit() || !this.availabilityFor(entry.programItemId)?.canSignup) return;

    const request: IEventParticipantRegisterRequest = this.auth.isAuthenticated()
      ? { mode: 'authenticated', programItemId: entry.programItemId }
      : { mode: 'guest', programItemId: entry.programItemId, ...guest };

    this.submitting.set(true);
    this.participant.register(request).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.submitting.set(false)),
    ).subscribe({
      next: (result) => {
        this.registrationResult.set(result);
        if (this.page.state() === page) this.loadAvailability(page.edition.id, false);
      },
      // A transport fault can leave the write outcome unknown. Never auto-retry it.
      error: () => this.uncertainProgramItemIds.update((ids) => new Set(ids).add(entry.programItemId)),
    });
  }

  refreshAvailability(): void {
    const page = this.page.state();
    if (page.kind === 'ready' && this.availability().kind !== 'loading') {
      this.loadAvailability(page.edition.id, false);
    }
  }

  private sessionStartAt(entry: PublicEventConfirmedEntry, timezone: string): number | null {
    const date = parseIsoDate(entry.occurrenceDate);
    const minutes = parseTimeLabelToMinutes(entry.slot.startTime);
    if (!date || minutes === null) return null;
    date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    const timestamp = timeZoneDateToTimestamp(date, timezone);
    return timestamp === null ? null : Date.parse(timestamp);
  }

  private loadAvailability(eventId: string, hydrate: boolean): void {
    this.availabilityRequest?.unsubscribe();
    const key = makeStateKey<AvailabilityState>(`public-event-participant-availability:${eventId}`);
    if (hydrate && this.platform.isBrowser && this.transferState.hasKey(key)) {
      this.availabilityState.set(this.transferState.get(key, { kind: 'error' }));
      this.transferState.remove(key);
      return;
    }

    this.availabilityState.set({ kind: 'loading' });
    this.availabilityRequest = this.participant.getPublicAvailability(eventId).subscribe({
      next: (items) => this.setAvailability({ kind: 'ready', eventId, items }, key),
      error: () => this.setAvailability({ kind: 'error' }, key),
    });
  }

  private setAvailability(
    state: AvailabilityState,
    key: StateKey<AvailabilityState>,
  ): void {
    this.availabilityState.set(state);
    if (!this.platform.isBrowser) this.transferState.set(key, state);
  }
}
