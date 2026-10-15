import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { EVENT_RPC } from '../../configs/event-rpc.config';
import { EventOccurrenceStatus } from '../../enums/event';
import { FilterOperator } from '../../enums/filter-operators';
import { IEvent } from '../../interfaces/i-event';
import type { IHostEventCatalogItem, IPublicEventCatalogItem } from '../../interfaces/i-event-catalog';
import { IEventOccurrence } from '../../interfaces/i-event-occurence';
import { IPublicEventPage } from '../../interfaces/i-event-page';
import { FilterDefinition } from '../../types/filter';
import type { PublicEventOccurrence } from '../../types/public-event-page';
import { Backend } from '../../services/backend/backend';

@Injectable({ providedIn: 'root' })
export class EventRead {
  private readonly backend = inject(Backend);

  getPublicPage(eventKey: string): Observable<IPublicEventPage | null> {
    return this.backend.rpc<IPublicEventPage | null>(
      EVENT_RPC.getPublicPage,
      { p_event_key: eventKey },
    );
  }

  getPublicCatalog(): Observable<IPublicEventCatalogItem[]> {
    return this.backend.rpc<IPublicEventCatalogItem[]>(EVENT_RPC.getPublicCatalog);
  }

  getHostCatalog(): Observable<IHostEventCatalogItem[]> {
    return this.backend.rpc<IHostEventCatalogItem[]>(
      EVENT_RPC.getHostCatalog,
    );
  }

  getPublicOccurrences(eventId: string): Observable<PublicEventOccurrence[]> {
    return this.getOccurrences({
      eventId: { operator: FilterOperator.EQ, value: eventId },
      status: {
        operator: FilterOperator.IN,
        value: [
          EventOccurrenceStatus.Published,
          EventOccurrenceStatus.ParticipantSignupOpen,
          EventOccurrenceStatus.ParticipantSignupClosed,
        ],
      },
    }).pipe(
      map((occurrences) =>
        occurrences.map(({ id, occurrenceDate }) => ({ id, occurrenceDate })),
      ),
    );
  }

  getEventBySlug(slug: string): Observable<IEvent | null> {
    return this.backend.getBySlug<IEvent>('events', slug);
  }

  getEventById(eventId: string): Observable<IEvent | null> {
    return this.backend.getById<IEvent>('events', eventId);
  }

  getOccurrenceById(occurrenceId: string): Observable<IEventOccurrence | null> {
    return this.backend.getById<IEventOccurrence>(
      'event_occurrences',
      occurrenceId,
    );
  }

  getOccurrenceByDate(
    eventId: string,
    occurrenceDate: string,
  ): Observable<IEventOccurrence | null> {
    return this.backend.getOneByFields<IEventOccurrence>('event_occurrences', {
      eventId,
      occurrenceDate,
    });
  }

  getOccurrencesInRange(
    eventId: string,
    fromIso: string,
    toIso: string,
    statuses?: EventOccurrenceStatus[],
  ): Observable<IEventOccurrence[]> {
    const filters: Record<string, FilterDefinition> = {
      eventId: {
        operator: FilterOperator.EQ,
        value: eventId,
      },
      occurrenceDate: [
        {
          operator: FilterOperator.GTE,
          value: fromIso,
        },
        {
          operator: FilterOperator.LTE,
          value: toIso,
        },
      ],
    };

    if (statuses?.length) {
      filters['status'] = {
        operator: FilterOperator.IN,
        value: statuses,
      };
    }

    return this.getOccurrences(filters);
  }

  private getOccurrences(
    filters: Record<string, FilterDefinition>,
  ): Observable<IEventOccurrence[]> {
    return this.backend.getAll<IEventOccurrence>({
      table: 'event_occurrences',
      sortBy: 'occurrenceDate',
      sortOrder: 'asc',
      pagination: { filters },
    });
  }
}
