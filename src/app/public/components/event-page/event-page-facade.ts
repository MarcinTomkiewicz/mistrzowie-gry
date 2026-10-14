import {
  DestroyRef,
  ErrorHandler,
  Injectable,
  TransferState,
  inject,
  makeStateKey,
  signal,
} from '@angular/core';
import { Observable, Subscription, catchError, map, of, switchMap } from 'rxjs';

import {
  buildPublicEventPath,
  isPublicEventSlug,
} from '../../../core/configs/events.config';
import type { IPublicEventPage } from '../../../core/interfaces/i-event-page';
import { EventRead } from '../../../core/reads/events/event-read';
import { Platform } from '../../../core/services/platform/platform';
import type { PublicEventPageState } from '../../../core/types/public-event-page';

@Injectable()
export class EventPageFacade {
  private readonly read = inject(EventRead);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly platform = inject(Platform);
  private readonly transferState = inject(TransferState);
  private readonly pageState = signal<PublicEventPageState>({ kind: 'loading' });
  private request: Subscription | null = null;

  readonly state = this.pageState.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.request?.unsubscribe());
  }

  load(eventKey: string, editionSlug: string | null): void {
    this.request?.unsubscribe();
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

    return this.read.getPublicOccurrences(edition.id).pipe(
      map((occurrences): PublicEventPageState => ({
        kind: 'ready', page, edition, occurrences,
      })),
    );
  }
}
