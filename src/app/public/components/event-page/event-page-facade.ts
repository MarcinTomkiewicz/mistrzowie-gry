import {
  DestroyRef,
  ErrorHandler,
  Injectable,
  TransferState,
  computed,
  inject,
  makeStateKey,
  signal,
} from '@angular/core';
import {
  Subscription, catchError, forkJoin, map, of,
} from 'rxjs';

import {
  buildPublicEventPath,
  isPublicEventSlug,
} from '../../../core/configs/events.config';
import type { IPublicEventPage } from '../../../core/interfaces/i-event-page';
import { EventRead } from '../../../core/reads/events/event-read';
import { EventProgramRead } from '../../../core/reads/events/event-program-read';
import { GmRead } from '../../../core/reads/gm/gm-read';
import { Platform } from '../../../core/services/platform/platform';
import type { PublicEventPageState, PublicEventProgramState } from '../../../core/types/public-event-page';
import type { PublicEventGmProfileState } from '../../../core/types/public-event-program';
import { formatTimeLabel, getTimeRangeBounds } from '../../../core/utils/time-format';
import { getPublicEventProgramTimeRange } from '../../../core/utils/public-event-program-cards';
import { getTodayIso, selectUpcomingOrLatestDate } from '../../../core/utils/date';
import { assertEdgeContract } from '../../../core/utils/edge-contract';

@Injectable()
export class EventPageFacade {
  private readonly read = inject(EventRead);
  private readonly programRead = inject(EventProgramRead);
  private readonly gmRead = inject(GmRead);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly platform = inject(Platform);
  private readonly transferState = inject(TransferState);
  private readonly pageState = signal<PublicEventPageState>({ kind: 'loading' });
  private readonly scheduleState = signal<PublicEventProgramState>({ kind: 'loading' });
  private request: Subscription | null = null;
  private programRequest: Subscription | null = null;
  private profileRequest: Subscription | null = null;
  private readonly gmProfileState = signal<PublicEventGmProfileState>({
    kind: 'idle',
  });
  private readonly occurrenceIndex = signal(0);

  readonly state = this.pageState.asReadonly();
  readonly programState = this.scheduleState.asReadonly();
  readonly profileState = this.gmProfileState.asReadonly();
  readonly selectedOccurrenceIndex = this.occurrenceIndex.asReadonly();
  readonly selectedOccurrence = computed(() => {
    const program = this.programState();
    return program.kind === 'ready' ? program.occurrences[this.occurrenceIndex()] ?? null : null;
  });
  readonly selectedProgram = computed(() => {
    const program = this.programState();
    const occurrenceId = this.selectedOccurrence()?.id;
    return program.kind === 'ready' ? program.program.filter(entry => entry.occurrenceId === occurrenceId) : [];
  });
  readonly selectedTimeRange = computed(() => {
    const state = this.state();
    if (state.kind !== 'ready') return null;

    const eventHours = getTimeRangeBounds([{
      startTime: formatTimeLabel(state.edition.startTime), endTime: formatTimeLabel(state.edition.endTime),
    }]);
    return getPublicEventProgramTimeRange(this.selectedProgram(), eventHours);
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.request?.unsubscribe();
      this.programRequest?.unsubscribe();
      this.profileRequest?.unsubscribe();
    });
  }

  load(eventKey: string, editionSlug: string | null): void {
    this.request?.unsubscribe();
    this.programRequest?.unsubscribe();
    this.closeGmProfile();
    this.occurrenceIndex.set(0);
    this.pageState.set({ kind: 'loading' });
    this.scheduleState.set({ kind: 'loading' });

    if (
      !isPublicEventSlug(eventKey) ||
      (editionSlug !== null && !isPublicEventSlug(editionSlug))
    ) {
      this.pageState.set({ kind: 'not-found' });
      return;
    }

    const stateKey = makeStateKey<PublicEventPageState | null>(
      `public-event-page:${eventKey}:${editionSlug ?? ''}`,
    );

    const cached = this.platform.isBrowser ? this.transferState.get(stateKey, null) : null;
    this.transferState.remove(stateKey);
    this.request = (cached ? of(cached) : this.read.getPublicPage(eventKey).pipe(
      map((page) => this.resolvePage(page, editionSlug)),
      catchError((error: unknown) => {
        this.errorHandler.handleError(error);
        return of<PublicEventPageState>({ kind: 'error' });
      }),
    )).subscribe((state) => {
      this.pageState.set(state);
      if (!this.platform.isBrowser) this.transferState.set(stateKey, state);
      if (state.kind === 'ready') this.loadProgram();
    });
  }

  private resolvePage(
    page: IPublicEventPage | null,
    editionSlug: string | null,
  ): PublicEventPageState {
    if (!page || !page.editions.length) {
      return { kind: 'not-found' };
    }

    if (!isPublicEventSlug(page.core.key)) {
      throw new Error('Public Event contains a noncanonical Core slug.');
    }

    const edition =
      editionSlug === null
        ? page.editions.find((item) => item.id === page.defaultEventId)
        : page.editions.find((item) => item.slug === editionSlug);

    if (!edition) {
      if (editionSlug === null) {
        throw new Error(
          'Public Event default Edition is missing from the public page.',
        );
      }
      return { kind: 'not-found' };
    }

    if (!isPublicEventSlug(edition.slug)) {
      throw new Error('Public Event contains a noncanonical Edition slug.');
    }

    if (editionSlug === null) {
      return {
        kind: 'redirect',
        path: buildPublicEventPath(page.core.key, edition.slug),
      };
    }

    return { kind: 'ready', page, edition };
  }

  loadProgram(): void {
    const page = this.state();
    if (page.kind !== 'ready') return;
    const eventId = page.edition.id;
    this.programRequest?.unsubscribe();
    const stateKey = makeStateKey<PublicEventProgramState | null>(`public-event-program:${eventId}`);
    const cached = this.platform.isBrowser ? this.transferState.get(stateKey, null) : null;
    this.transferState.remove(stateKey);
    this.scheduleState.set({ kind: 'loading' });
    this.programRequest = (cached ? of(cached) : forkJoin({
      occurrences: this.read.getPublicOccurrences(eventId),
      program: this.programRead.getPublicProgram(eventId),
    }).pipe(
      map(({ occurrences, program }): PublicEventProgramState => {
        assertEdgeContract(new Set(occurrences.map(day => day.id)).size === occurrences.length &&
          new Set(occurrences.map(day => day.occurrenceDate)).size === occurrences.length &&
          program.entries.every(entry => occurrences.some(day => day.id === entry.occurrenceId && day.occurrenceDate === entry.occurrenceDate)),
        'publicEventProgram.scope', 'unique public Occurrences and matching programme identities and dates');
        return { kind: 'ready', eventId, occurrences: [...occurrences].sort((a, b) => a.occurrenceDate.localeCompare(b.occurrenceDate)),
          program: program.entries };
      }),
      catchError((error: unknown) => {
        this.errorHandler.handleError(error);
        return of<PublicEventProgramState>({ kind: 'error' });
      }),
    )).subscribe(state => {
      if (state.kind === 'ready') {
        const date = selectUpcomingOrLatestDate(state.occurrences.map(day => day.occurrenceDate), getTodayIso(new Date(), page.edition.timezone));
        this.occurrenceIndex.set(Math.max(0, state.occurrences.findIndex(day => day.occurrenceDate === date)));
      }
      this.scheduleState.set(state);
      if (!this.platform.isBrowser) this.transferState.set(stateKey, state);
    });
  }

  selectOccurrence(index: number): void {
    const program = this.programState();
    if (program.kind !== 'ready' || !program.occurrences[index]) return;
    this.closeGmProfile();
    this.occurrenceIndex.set(index);
  }

  openGmProfile(programItemId: string | null): void {
    const state = this.state();
    const entry = this.selectedProgram().find((item) =>
      item.kind !== 'pending' && item.programItemId === programItemId,
    );
    if (state.kind !== 'ready' || !entry || entry.host === null) return;

    this.closeGmProfile();
    this.gmProfileState.set({ kind: 'loading' });
    this.profileRequest = this.gmRead
      .getPublicEventProfile(state.edition.id, entry.host.userId)
      .subscribe({
        next: (profile) => this.gmProfileState.set(
          profile ? { kind: 'ready', profile } : { kind: 'not-found' },
        ),
        error: (error: unknown) => {
          this.errorHandler.handleError(error);
          this.gmProfileState.set({ kind: 'error' });
        },
      });
  }

  closeGmProfile(): void {
    this.profileRequest?.unsubscribe();
    this.profileRequest = null;
    this.gmProfileState.set({ kind: 'idle' });
  }
}
