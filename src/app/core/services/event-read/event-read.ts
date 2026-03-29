import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';

import {
  EventOccurrenceStatus,
  EventProgramItemSourceKind,
  EventProgramItemStatus,
} from '../../enums/event';
import { FilterOperator } from '../../enums/filter-operators';
import { IFilter } from '../../interfaces/i-filter';
import { IEvent } from '../../interfaces/i-event';
import { IEventSignupLoadData } from '../../interfaces/i-event-signup';
import { IEventOccurrence } from '../../interfaces/i-event-occurence';
import {
  IEventProgramItem,
  IEventProgramItemWithDetails,
} from '../../interfaces/i-event-program-item';
import { IOccurrenceSwitcherOption } from '../../interfaces/i-occurrence-switcher';
import { ISessionWithRelations } from '../../interfaces/i-session';
import { IUser } from '../../interfaces/i-user';
import { hasMinimumRole } from '../../utils/roles';
import { Backend } from '../backend/backend';
import { GmRead } from '../gm-read/gm-read';
import { GmSessionsFacade } from '../gm-sessions/gm-sessions';
import { SessionRead } from '../session-read/session-read';

interface IEventPublicProgramLoadData {
  event: IEvent;
  occurrences: IEventOccurrence[];
  programsByOccurrenceId: Map<string, IEventProgramItemWithDetails[]>;
}

@Injectable({ providedIn: 'root' })
export class EventRead {
  private readonly backend = inject(Backend);
  private readonly gmRead = inject(GmRead);
  private readonly gmSessions = inject(GmSessionsFacade);
  private readonly sessionRead = inject(SessionRead);

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
    const filters: Record<string, IFilter> = {
      eventId: {
        operator: FilterOperator.EQ,
        value: eventId,
      },
      occurrenceDate: {
        operator: FilterOperator.GTE,
        value: fromIso,
      },
    };

    if (statuses?.length) {
      filters['status'] = {
        operator: FilterOperator.IN,
        value: statuses,
      };
    }

    return this.backend
      .getAll<IEventOccurrence>({
        table: 'event_occurrences',
        sortBy: 'occurrenceDate',
        sortOrder: 'asc',
        pagination: {
          filters,
        },
      })
      .pipe(
        map((occurrences) =>
          occurrences.filter(
            (occurrence) => occurrence.occurrenceDate <= toIso,
          ),
        ),
      );
  }

  getOccurrenceOptions(
    eventId: string,
    fromIso: string,
    toIso: string,
    statuses?: EventOccurrenceStatus[],
  ): Observable<IOccurrenceSwitcherOption[]> {
    return this.getOccurrencesInRange(eventId, fromIso, toIso, statuses).pipe(
      map((occurrences) =>
        occurrences.map((occurrence) => ({
          id: occurrence.id,
          label: occurrence.occurrenceDate,
          occurrenceDate: occurrence.occurrenceDate,
        })),
      ),
    );
  }

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
        pagination: {
          filters,
        },
      })
      .pipe(
        switchMap((items) => {
          if (!items.length) {
            return of([] as IEventProgramItemWithDetails[]);
          }

          return forkJoin(items.map((item) => this.hydrateProgramItem(item)));
        }),
        map((items) =>
          items
            .filter(
              (item): item is IEventProgramItemWithDetails => item !== null,
            )
            .sort((a, b) => {
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
    return this.getEventBySlug(eventSlug).pipe(
      switchMap((event) => {
        if (!event) {
          return of(null);
        }

        return this.getOccurrencesInRange(
          event.id,
          options.startIso,
          options.endIso,
          options.occurrenceStatuses,
        ).pipe(
          map((occurrences) => {
            if (options.includePastOccurrences || !options.todayIso) {
              return occurrences;
            }

            return occurrences.filter(
              (occurrence) => occurrence.occurrenceDate >= options.todayIso!,
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

  getHostSignupLoadData(
    eventSlug: string,
    occurrenceDate: string,
    userId: string | null,
  ): Observable<IEventSignupLoadData> {
    return this.getEventBySlug(eventSlug).pipe(
      switchMap((event) => {
        if (!event) {
          return of(this.createEmptyHostSignupLoadData());
        }

        return this.getOccurrenceByDate(event.id, occurrenceDate).pipe(
          switchMap((occurrence) => {
            if (!occurrence) {
              return of({
                ...this.createEmptyHostSignupLoadData(),
                page: {
                  ...this.createEmptyHostSignupLoadData().page,
                  event,
                },
              } satisfies IEventSignupLoadData);
            }

            return forkJoin({
              user: userId
                ? this.backend
                    .getById<IUser>('users', userId)
                    .pipe(switchMap((user) => of(user)))
                : of(null),
              signups: this.backend.getAll<IEventProgramItem>({
                table: 'event_program_items',
                pagination: {
                  filters: {
                    occurrenceId: {
                      operator: FilterOperator.EQ,
                      value: occurrence.id,
                    },
                  },
                },
              }),
              mySignup: userId
                ? this.getMySignupForOccurrence(occurrence.id, userId)
                : of(null),
              templateSessions: userId
                ? this.sessionRead.getSessionTemplatesByGmProfileId(userId)
                : of([] as ISessionWithRelations[]),
              customSessions: userId
                ? this.sessionRead.getCustomSessionsByGmProfileId(userId)
                : of([] as ISessionWithRelations[]),
              systems: this.gmSessions.getAvailableSystems(),
              styles: this.gmSessions.getAvailableStyles(),
              triggers: this.gmSessions.getAvailableTriggers(),
            }).pipe(
              map(
                ({
                  user,
                  signups,
                  mySignup,
                  templateSessions,
                  customSessions,
                  systems,
                  styles,
                  triggers,
                }) => {
                  const activeSignupCount = signups.filter(
                    (item) =>
                      item.status !== EventProgramItemStatus.Withdrawn &&
                      item.status !== EventProgramItemStatus.Rejected,
                  ).length;

                  const isFull = activeSignupCount >= occurrence.slotCapacity;
                  const isAdmin = hasMinimumRole(user, 'admin');
                  const canAccess = !isFull || isAdmin || !!mySignup;

                  return {
                    page: {
                      event,
                      occurrence,
                      mySignup,
                      signupCount: activeSignupCount,
                      isFull,
                      canAccess,
                      isAdmin,
                    },
                    resources: {
                      templateSessions,
                      customSessions,
                      systems,
                      styles,
                      triggers,
                    },
                  } satisfies IEventSignupLoadData;
                },
              ),
            );
          }),
        );
      }),
    );
  }

  createEmptyHostSignupLoadData(): IEventSignupLoadData {
    return {
      page: {
        event: null,
        occurrence: null,
        mySignup: null,
        signupCount: 0,
        isFull: false,
        canAccess: false,
        isAdmin: false,
      },
      resources: {
        templateSessions: [],
        customSessions: [],
        systems: [],
        styles: [],
        triggers: [],
      },
    };
  }

  private getMySignupForOccurrence(
    occurrenceId: string,
    userId: string,
  ): Observable<IEventProgramItem | null> {
    return this.backend
      .getAll<IEventProgramItem>({
        table: 'event_program_items',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        pagination: {
          filters: {
            occurrenceId: {
              operator: FilterOperator.EQ,
              value: occurrenceId,
            },
            hostUserId: {
              operator: FilterOperator.EQ,
              value: userId,
            },
          },
        },
        range: { from: 0, to: 9 },
      })
      .pipe(
        map(
          (items) =>
            items.find(
              (item) => item.status !== EventProgramItemStatus.Withdrawn,
            ) ?? null,
        ),
      );
  }

  private hydrateProgramItem(
    item: IEventProgramItem,
  ): Observable<IEventProgramItemWithDetails | null> {
    return this.getProgramItemSession(item).pipe(
      switchMap((session) => {
        if (!session) {
          return of(null);
        }

        return this.gmRead.getProfileById(item.hostUserId).pipe(
          map((host) => {
            if (!host) {
              return null;
            }

            return {
              ...item,
              session,
              host,
            } satisfies IEventProgramItemWithDetails;
          }),
        );
      }),
    );
  }

  private getProgramItemSession(
    item: IEventProgramItem,
  ): Observable<ISessionWithRelations | null> {
    if (
      item.sourceKind === EventProgramItemSourceKind.GmSessionTemplate &&
      item.gmSessionTemplateId
    ) {
      return this.sessionRead.getSessionTemplateById(item.gmSessionTemplateId);
    }

    if (
      item.sourceKind === EventProgramItemSourceKind.CustomSession &&
      item.customSessionId
    ) {
      return this.sessionRead.getCustomSessionById(item.customSessionId);
    }

    return of(null);
  }
}