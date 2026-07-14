import { inject, Injectable } from '@angular/core';
import {
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  throwError,
} from 'rxjs';

import {
  EventOccurrenceStatus,
  EventProgramItemSourceKind,
  EventProgramItemStatus,
} from '../../enums/event';
import { FilterOperator } from '../../enums/filter-operators';
import {
  IEventProgramItem,
  IEventProgramItemWithDetails,
} from '../../interfaces/i-event-program-item';
import { IFilter } from '../../interfaces/i-filter';
import { ISessionWithRelations } from '../../interfaces/i-session';
import { IEventPublicProgramLoadData } from '../../types/event-program';
import { ACTIVE_HOST_SIGNUP_STATUSES } from '../../types/event-signup';
import { SessionSourceKind } from '../../types/session-source';
import { Backend } from '../backend/backend';
import { EventRead } from '../event-read/event-read';
import { GmRead } from '../gm-read/gm-read';
import { SessionRead } from '../session-read/session-read';

@Injectable({ providedIn: 'root' })
export class EventProgramRead {
  private readonly backend = inject(Backend);
  private readonly eventRead = inject(EventRead);
  private readonly gmRead = inject(GmRead);
  private readonly sessionRead = inject(SessionRead);

  getProgramItemsByOccurrenceId(
    occurrenceId: string,
    statuses?: EventProgramItemStatus[],
  ): Observable<IEventProgramItemWithDetails[]> {
    const filters: Record<string, IFilter> = {
      occurrenceId: {
        operator: FilterOperator.EQ,
        value: occurrenceId,
      },
    };

    if (statuses?.length) {
      filters['status'] = {
        operator: FilterOperator.IN,
        value: statuses,
      };
    }

    return this.backend
      .getAll<IEventProgramItem>({
        table: 'event_program_items',
        sortBy: 'displayOrder',
        sortOrder: 'asc',
        pagination: { filters },
      })
      .pipe(
        switchMap((items) => {
          if (!items.length) {
            return of([] as IEventProgramItemWithDetails[]);
          }

          return forkJoin(items.map((item) => this.hydrateProgramItem(item)));
        }),
        map((items) =>
          items.sort((a, b) => {
            const aOrder = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
            const bOrder = b.displayOrder ?? Number.MAX_SAFE_INTEGER;

            if (aOrder !== bOrder) {
              return aOrder - bOrder;
            }

            return a.session.title.localeCompare(b.session.title, 'pl');
          }),
        ),
      );
  }

  getPublishedProgramItemsByOccurrenceId(
    occurrenceId: string,
  ): Observable<IEventProgramItemWithDetails[]> {
    return this.getProgramItemsByOccurrenceId(occurrenceId, [
      EventProgramItemStatus.Published,
    ]);
  }

  getActiveHostSignupCountByOccurrenceId(
    occurrenceId: string,
  ): Observable<number> {
    return this.backend.getCount('event_program_items', {
      occurrenceId: {
        operator: FilterOperator.EQ,
        value: occurrenceId,
      },
      status: {
        operator: FilterOperator.IN,
        value: [...ACTIVE_HOST_SIGNUP_STATUSES],
      },
    });
  }

  getPublicProgramLoadData(
    eventSlug: string,
    options: {
      startIso: string;
      endIso: string;
      todayIso?: string;
      occurrenceStatuses?: EventOccurrenceStatus[];
      programStatuses?: EventProgramItemStatus[];
      includePastOccurrences?: boolean;
    },
  ): Observable<IEventPublicProgramLoadData | null> {
    return this.eventRead.getEventBySlug(eventSlug).pipe(
      switchMap((event) => {
        if (!event) {
          return of(null);
        }

        return this.eventRead
          .getOccurrencesInRange(
            event.id,
            options.startIso,
            options.endIso,
            options.occurrenceStatuses,
          )
          .pipe(
            map((occurrences) => {
              const todayIso = options.todayIso;

              if (options.includePastOccurrences || !todayIso) {
                return occurrences;
              }

              return occurrences.filter(
                (occurrence) => occurrence.occurrenceDate >= todayIso,
              );
            }),
            switchMap((occurrences) => {
              if (!occurrences.length) {
                return of({
                  event,
                  occurrences: [],
                  programsByOccurrenceId: new Map<
                    string,
                    IEventProgramItemWithDetails[]
                  >(),
                } satisfies IEventPublicProgramLoadData);
              }

              return forkJoin(
                occurrences.map((occurrence) =>
                  this.getProgramItemsByOccurrenceId(
                    occurrence.id,
                    options.programStatuses,
                  ).pipe(
                    map((items) => ({
                      occurrenceId: occurrence.id,
                      items,
                    })),
                  ),
                ),
              ).pipe(
                map(
                  (programs) =>
                    ({
                      event,
                      occurrences,
                      programsByOccurrenceId: new Map(
                        programs.map((program) => [
                          program.occurrenceId,
                          program.items,
                        ]),
                      ),
                    }) satisfies IEventPublicProgramLoadData,
                ),
              );
            }),
          );
      }),
    );
  }

  private hydrateProgramItem(
    item: IEventProgramItem,
  ): Observable<IEventProgramItemWithDetails> {
    return this.getProgramItemSession(item).pipe(
      switchMap((session) =>
        this.gmRead.getProfileById(item.hostUserId).pipe(
          map((host) => {
            if (!host) {
              throw new Error(
                `[EVENT_PROGRAM_READ] Missing host profile "${item.hostUserId}" for program item "${item.id}".`,
              );
            }

            return {
              ...item,
              session,
              host,
            } satisfies IEventProgramItemWithDetails;
          }),
        ),
      ),
    );
  }

  private getProgramItemSession(
    item: IEventProgramItem,
  ): Observable<ISessionWithRelations> {
    switch (item.sourceKind) {
      case EventProgramItemSourceKind.GmSessionTemplate:
        return this.getRequiredSession(
          item,
          item.gmSessionTemplateId,
          'template',
        );
      case EventProgramItemSourceKind.CustomSession:
        return this.getRequiredSession(item, item.customSessionId, 'custom');
      default:
        return throwError(
          () =>
            new Error(
              `[EVENT_PROGRAM_READ] Unsupported source "${item.sourceKind}" for program item "${item.id}".`,
            ),
        );
    }
  }

  private getRequiredSession(
    item: IEventProgramItem,
    sessionId: string | null,
    source: SessionSourceKind,
  ): Observable<ISessionWithRelations> {
    if (!sessionId) {
      return throwError(
        () =>
          new Error(
            `[EVENT_PROGRAM_READ] Program item "${item.id}" has source "${item.sourceKind}" without a session id.`,
          ),
      );
    }

    return this.sessionRead.getSessionById(sessionId, source).pipe(
      switchMap((session) => {
        if (!session) {
          return throwError(
            () =>
              new Error(
                `[EVENT_PROGRAM_READ] Missing ${source} session "${sessionId}" for program item "${item.id}".`,
              ),
          );
        }

        return of(session);
      }),
    );
  }
}
