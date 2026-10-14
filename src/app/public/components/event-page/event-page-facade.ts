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
  Observable, Subscription, catchError, forkJoin, map, of, switchMap,
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
import type { PublicEventPageState } from '../../../core/types/public-event-page';
import type { PublicEventGmProfileState } from '../../../core/types/public-event-program';

@Injectable()
export class EventPageFacade {
  private readonly read = inject(EventRead);
  private readonly programRead = inject(EventProgramRead);
  private readonly gmRead = inject(GmRead);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly platform = inject(Platform);
  private readonly transferState = inject(TransferState);
  private readonly pageState = signal<PublicEventPageState>({ kind: 'loading' });
  private request: Subscription | null = null;
  private profileRequest: Subscription | null = null;
  private readonly gmProfileState = signal<PublicEventGmProfileState>({
    kind: 'idle',
  });
  private readonly occurrenceIndex = signal(0);

  readonly state = this.pageState.asReadonly();
  readonly profileState = this.gmProfileState.asReadonly();
  readonly selectedOccurrenceIndex = this.occurrenceIndex.asReadonly();
  readonly selectedOccurrence = computed(() => {
    const state = this.state();
    return state.kind === 'ready'
      ? state.occurrences[this.occurrenceIndex()] ?? null : null;
  });
  readonly selectedProgram = computed(() => {
    const state = this.state();
    const occurrenceId = this.selectedOccurrence()?.id;
    return state.kind === 'ready'
      ? state.program.filter((entry) => entry.occurrenceId === occurrenceId)
      : [];
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.request?.unsubscribe();
      this.profileRequest?.unsubscribe();
    });
  }

  load(eventKey: string, editionSlug: string | null): void {
    this.request?.unsubscribe();
    this.closeGmProfile();
    this.occurrenceIndex.set(0);
    this.pageState.set({ kind: 'loading' });

    if (
      !isPublicEventSlug(eventKey) ||
      (editionSlug !== null && !isPublicEventSlug(editionSlug))
    ) {
      this.pageState.set({ kind: 'not-found' });
      return;
    }

    const stateKey = makeStateKey<PublicEventPageState>(
      `public-event-page:${eventKey}:${editionSlug ?? ''}`,
    );

    if (this.platform.isBrowser && this.transferState.hasKey(stateKey)) {
      this.pageState.set(this.transferState.get(stateKey, { kind: 'not-found' }));
      this.transferState.remove(stateKey);
      return;
    }

    this.request = this.read.getPublicPage(eventKey)
      .pipe(
        switchMap((page) => this.loadEdition(page, editionSlug)),
        catchError((error: unknown) => {
          this.errorHandler.handleError(error);
          return of<PublicEventPageState>({ kind: 'error' });
        }),
      )
      .subscribe((state) => {
        this.pageState.set(state);
        if (!this.platform.isBrowser) this.transferState.set(stateKey, state);
      });
  }

  private loadEdition(
    page: IPublicEventPage | null,
    editionSlug: string | null,
  ): Observable<PublicEventPageState> {
    if (!page || !page.editions.length) {
      return of({ kind: 'not-found' });
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
      return of({ kind: 'not-found' });
    }

    if (!isPublicEventSlug(edition.slug)) {
      throw new Error('Public Event contains a noncanonical Edition slug.');
    }

    if (editionSlug === null) {
      return of({
        kind: 'redirect',
        path: buildPublicEventPath(page.core.key, edition.slug),
      });
    }

    return forkJoin({
      occurrences: this.read.getPublicOccurrences(edition.id),
      program: this.programRead.getPublicProgram(edition.id),
    }).pipe(
      map(({ occurrences, program }): PublicEventPageState => ({
        kind: 'ready', page, edition, occurrences,
        program: program.entries, systems: program.systems,
      })),
    );
  }

  selectOccurrence(index: number): void {
    const state = this.state();
    if (state.kind !== 'ready' || !state.occurrences[index]) return;
    this.closeGmProfile();
    this.occurrenceIndex.set(index);
  }

  openGmProfile(programItemId: string | null): void {
    const state = this.state();
    const entry = this.selectedProgram().find((item) =>
      item.kind !== 'pending' && item.programItemId === programItemId,
    );
    if (state.kind !== 'ready' || !entry || entry.kind === 'pending') return;

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
