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
import { ACTIVE_HOST_SIGNUP_STATUSES } from '../../types/event-signup';
import { SessionSourceKind } from '../../types/session-source';
import { Backend } from '../../services/backend/backend';
import { GmRead } from '../gm/gm-read';
import { SessionRead } from '../sessions/session-read';
import { EVENT_RPC } from '../../configs/event-rpc.config';
import type {
  PublicEventProgramData,
  PublicEventProgramWireEntry,
} from '../../types/public-event-program';
import type { ISystem } from '../../interfaces/i-system';
import { decodePublicEventProgram } from './public-event-program.contract';

@Injectable({ providedIn: 'root' })
export class EventProgramRead {
  private readonly backend = inject(Backend);
  private readonly gmRead = inject(GmRead);
  private readonly sessionRead = inject(SessionRead);

  getPublicProgram(
    eventId: string,
    occurrenceId: string | null = null,
  ): Observable<PublicEventProgramData> {
    return this.backend
      .rpc<PublicEventProgramWireEntry[]>(EVENT_RPC.getPublicProgram, {
        p_event_id: eventId,
        p_occurrence_id: occurrenceId,
      })
      .pipe(
        map(decodePublicEventProgram),
        switchMap((entries) => {
          const systemIds = [...new Set(entries.flatMap((entry) =>
            entry.kind === undefined && entry.session.systemId ? [entry.session.systemId] : [],
          ))];
          return this.backend.getByIds<ISystem>('systems', systemIds).pipe(
            map((systems) => {
              if (systemIds.some((id) => !systems.some((system) => system.id === id))) {
                throw new Error('Public Event program references a missing system.');
              }
              return { entries, systems };
            }),
          );
        }),
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
