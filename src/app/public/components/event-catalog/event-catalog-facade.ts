import {
  DestroyRef, ErrorHandler, Injectable, TransferState, inject, makeStateKey, signal,
} from '@angular/core';
import { Subscription, catchError, map, of } from 'rxjs';

import { EVENT_KEYS, isPublicEventSlug } from '../../../core/configs/events.config';
import type { IPublicEventCatalogItem } from '../../../core/interfaces/i-event-catalog';
import { EventRead } from '../../../core/reads/events/event-read';
import { Platform } from '../../../core/services/platform/platform';
import type { PublicEventCatalogState } from '../../../core/types/public-event-catalog';

const PUBLIC_EVENT_CATALOG_STATE = makeStateKey<PublicEventCatalogState>('public-event-catalog');

@Injectable()
export class EventCatalogFacade {
  private readonly read = inject(EventRead);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly platform = inject(Platform);
  private readonly transferState = inject(TransferState);
  private readonly catalogState = signal<PublicEventCatalogState>({ kind: 'loading' });
  private request: Subscription | null = null;

  readonly state = this.catalogState.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.request?.unsubscribe());
  }

  load(): void {
    this.request?.unsubscribe();
    this.catalogState.set({ kind: 'loading' });

    if (this.platform.isBrowser && this.transferState.hasKey(PUBLIC_EVENT_CATALOG_STATE)) {
      this.catalogState.set(this.transferState.get(PUBLIC_EVENT_CATALOG_STATE, { kind: 'loading' }));
      this.transferState.remove(PUBLIC_EVENT_CATALOG_STATE);
      return;
    }

    this.request = this.read.getPublicCatalog().pipe(
      map((items): PublicEventCatalogState => ({
        kind: 'ready', items: this.selectCanonicalItems(items),
      })),
      catchError((error: unknown) => {
        this.errorHandler.handleError(error);
        return of<PublicEventCatalogState>({ kind: 'error' });
      }),
    ).subscribe((state) => {
      this.catalogState.set(state);
      if (!this.platform.isBrowser) this.transferState.set(PUBLIC_EVENT_CATALOG_STATE, state);
    });
  }

  private selectCanonicalItems(items: readonly IPublicEventCatalogItem[]): IPublicEventCatalogItem[] {
    return items.flatMap((item) => {
      if (item.coreKey === EVENT_KEYS.chaoticThursdays || !isPublicEventSlug(item.coreKey)) return [];
      const editions = item.editions
        .filter((edition) => isPublicEventSlug(edition.slug))
        .sort((left, right) => left.nextOccurrenceDate.localeCompare(right.nextOccurrenceDate));
      const nearest = editions[0];
      return nearest ? [{ ...item, editions, nextOccurrenceDate: nearest.nextOccurrenceDate }] : [];
    }).sort((left, right) =>
      left.nextOccurrenceDate.localeCompare(right.nextOccurrenceDate) ||
      left.name.localeCompare(right.name) || left.coreKey.localeCompare(right.coreKey));
  }
}
