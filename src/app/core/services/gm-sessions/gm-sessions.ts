import { inject, Injectable } from '@angular/core';
import { map, Observable, of, switchMap, throwError } from 'rxjs';

import { FilterOperator } from '../../enums/filter-operators';
import { IContentTrigger } from '../../interfaces/i-content-trigger';
import { IGmStyle } from '../../interfaces/i-gm-style';
import {
  ICreateSessionPayload,
  ISession,
  ISessionWithRelations,
  IUpdateSessionPayload,
} from '../../interfaces/i-session';
import { ISystem } from '../../interfaces/i-system';
import { Auth } from '../auth/auth';
import { Backend } from '../backend/backend';
import { SessionRead } from '../session-read/session-read';

type SessionSourceKind = 'template' | 'custom';

interface ISessionRecord
  extends Pick<
    ISession,
    | 'gmProfileId'
    | 'systemId'
    | 'title'
    | 'description'
    | 'image'
    | 'difficultyLevel'
    | 'minPlayers'
    | 'maxPlayers'
    | 'minAge'
    | 'sortOrder'
  > {
  id?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface ISessionStyleRow {
  sessionId: string;
  gmStyleId: string;
  createdAt: string | null;
}

interface ISessionTriggerRow {
  sessionId: string;
  contentTriggerId: string;
  createdAt: string | null;
}

const SESSION_SOURCE_CONFIG: Record<
  SessionSourceKind,
  {
    sessionsTable: string;
    stylesTable: string;
    triggersTable: string;
    sessionIdKey: 'gmSessionTemplateId' | 'customSessionId';
  }
> = {
  template: {
    sessionsTable: 'gm_session_templates',
    stylesTable: 'gm_session_template_styles',
    triggersTable: 'gm_session_template_triggers',
    sessionIdKey: 'gmSessionTemplateId',
  },
  custom: {
    sessionsTable: 'custom_sessions',
    stylesTable: 'custom_session_styles',
    triggersTable: 'custom_session_triggers',
    sessionIdKey: 'customSessionId',
  },
};

@Injectable({ providedIn: 'root' })
export class GmSessionsFacade {
  private readonly auth = inject(Auth);
  private readonly backend = inject(Backend);
  private readonly sessionRead = inject(SessionRead);

  getMySessions(
    source: SessionSourceKind = 'template',
  ): Observable<ISessionWithRelations[]> {
    const userId = this.auth.userId();

    if (!userId) {
      return of([]);
    }

    return source === 'template'
      ? this.sessionRead.getSessionTemplatesByGmProfileId(userId)
      : this.sessionRead.getCustomSessionsByGmProfileId(userId);
  }

  getMySessionRequired(
    sessionId: string,
    source: SessionSourceKind = 'template',
  ): Observable<ISessionWithRelations> {
    const userId = this.auth.userId();

    if (!userId) {
      return throwError(() => new Error('Unauthorized.'));
    }

    const read$ =
      source === 'template'
        ? this.sessionRead.getSessionTemplateById(sessionId, userId)
        : this.sessionRead.getCustomSessionById(sessionId, userId);

    return read$.pipe(
      switchMap((session) => {
        if (!session) {
          return throwError(() => new Error('Session not found.'));
        }

        return of(session);
      }),
    );
  }

  getAvailableSystems(): Observable<ISystem[]> {
    return this.backend.getAll<ISystem>({
      table: 'systems',
      sortBy: 'name',
      sortOrder: 'asc',
    });
  }

  getMySessionSystems(
    source: SessionSourceKind = 'template',
  ): Observable<ISystem[]> {
    const userId = this.auth.userId();

    if (!userId) {
      return of([]);
    }

    return this.getSessionSystemsByGmProfileId(userId, source);
  }

  getSessionSystemsByGmProfileId(
    gmProfileId: string,
    source: SessionSourceKind = 'template',
  ): Observable<ISystem[]> {
    const config = SESSION_SOURCE_CONFIG[source];

    return this.backend
      .getAll<Pick<ISession, 'systemId'>>({
        table: config.sessionsTable,
        pagination: {
          filters: {
            gmProfileId: {
              operator: FilterOperator.EQ,
              value: gmProfileId,
            },
          },
        },
      })
      .pipe(
        switchMap((sessions) => {
          const systemIds = [
            ...new Set(sessions.map((session) => session.systemId).filter(Boolean)),
          ];

          if (!systemIds.length) {
            return of([]);
          }

          return this.backend.getByIds<ISystem>('systems', systemIds).pipe(
            map((systems) =>
              [...systems].sort((a, b) => a.name.localeCompare(b.name, 'pl')),
            ),
          );
        }),
      );
  }

  getAvailableStyles(): Observable<IGmStyle[]> {
    return this.backend.getAll<IGmStyle>({
      table: 'gm_styles',
      sortBy: 'sortOrder',
      sortOrder: 'asc',
      pagination: {
        filters: {
          isActive: {
            operator: FilterOperator.EQ,
            value: true,
          },
        },
      },
    });
  }

  getAvailableTriggers(): Observable<IContentTrigger[]> {
    return this.backend.getAll<IContentTrigger>({
      table: 'content_triggers',
      sortBy: 'label',
      sortOrder: 'asc',
      pagination: {
        filters: {
          isActive: {
            operator: FilterOperator.EQ,
            value: true,
          },
        },
      },
    });
  }

  createMySession(
    payload: ICreateSessionPayload,
    source: SessionSourceKind = 'template',
  ): Observable<ISessionWithRelations> {
    const userId = this.auth.userId();
    const config = SESSION_SOURCE_CONFIG[source];

    if (!userId) {
      return throwError(() => new Error('Unauthorized.'));
    }

    return this.backend
      .create<ISessionRecord>(config.sessionsTable, {
        gmProfileId: userId,
        systemId: payload.systemId,
        title: payload.title,
        description: payload.description,
        image: payload.image,
        difficultyLevel: payload.difficultyLevel,
        minPlayers: payload.minPlayers,
        maxPlayers: payload.maxPlayers,
        minAge: payload.minAge,
        sortOrder: payload.sortOrder ?? 0,
      })
      .pipe(
        switchMap((session) => {
          if (!session.id) {
            return throwError(() => new Error('Session id was not returned.'));
          }

          return this.replaceSessionStyles(
            session.id,
            payload.gmStyleIds,
            source,
          ).pipe(
            switchMap(() =>
              this.replaceSessionTriggers(
                session.id as string,
                payload.triggerIds,
                source,
              ),
            ),
            map(() => session.id as string),
          );
        }),
        switchMap((sessionId) => this.getMySessionRequired(sessionId, source)),
      );
  }

  updateMySession(
    sessionId: string,
    payload: IUpdateSessionPayload,
    source: SessionSourceKind = 'template',
  ): Observable<ISessionWithRelations> {
    const userId = this.auth.userId();
    const config = SESSION_SOURCE_CONFIG[source];

    if (!userId) {
      return throwError(() => new Error('Unauthorized.'));
    }

    return this.getMySessionRequired(sessionId, source).pipe(
      switchMap((session) =>
        this.backend.update<ISessionRecord>(
          config.sessionsTable,
          sessionId,
          {
            systemId: payload.systemId,
            title: payload.title,
            description: payload.description,
            image: payload.image,
            difficultyLevel: payload.difficultyLevel,
            minPlayers: payload.minPlayers,
            maxPlayers: payload.maxPlayers,
            minAge: payload.minAge,
            sortOrder: payload.sortOrder ?? session.sortOrder,
          },
        ),
      ),
      switchMap(() =>
        this.replaceSessionStyles(sessionId, payload.gmStyleIds, source).pipe(
          switchMap(() =>
            this.replaceSessionTriggers(sessionId, payload.triggerIds, source),
          ),
        ),
      ),
      switchMap(() => this.getMySessionRequired(sessionId, source)),
    );
  }

  deleteMySession(
    sessionId: string,
    source: SessionSourceKind = 'template',
  ): Observable<void> {
    const userId = this.auth.userId();
    const config = SESSION_SOURCE_CONFIG[source];

    if (!userId) {
      return throwError(() => new Error('Unauthorized.'));
    }

    return this.backend.delete(config.sessionsTable, {
      id: {
        operator: FilterOperator.EQ,
        value: sessionId,
      },
      gmProfileId: {
        operator: FilterOperator.EQ,
        value: userId,
      },
    });
  }

  replaceSessionStyles(
    sessionId: string,
    gmStyleIds: string[],
    source: SessionSourceKind = 'template',
  ): Observable<void> {
    const uniqueStyleIds = [...new Set(gmStyleIds.filter(Boolean))];
    const config = SESSION_SOURCE_CONFIG[source];

    return this.backend
      .delete(config.stylesTable, {
        [config.sessionIdKey]: {
          operator: FilterOperator.EQ,
          value: sessionId,
        },
      })
      .pipe(
        switchMap(() => {
          if (!uniqueStyleIds.length) {
            return of(void 0);
          }

          return this.backend
            .createMany<
              Pick<ISessionStyleRow, 'sessionId' | 'gmStyleId'>
            >(
              config.stylesTable,
              uniqueStyleIds.map((gmStyleId) => ({
                [config.sessionIdKey]: sessionId,
                gmStyleId,
              })) as Array<
                Pick<ISessionStyleRow, 'sessionId' | 'gmStyleId'>
              >,
            )
            .pipe(map(() => void 0));
        }),
      );
  }

  replaceSessionTriggers(
    sessionId: string,
    triggerIds: string[],
    source: SessionSourceKind = 'template',
  ): Observable<void> {
    const uniqueTriggerIds = [...new Set(triggerIds.filter(Boolean))];
    const config = SESSION_SOURCE_CONFIG[source];

    return this.backend
      .delete(config.triggersTable, {
        [config.sessionIdKey]: {
          operator: FilterOperator.EQ,
          value: sessionId,
        },
      })
      .pipe(
        switchMap(() => {
          if (!uniqueTriggerIds.length) {
            return of(void 0);
          }

          return this.backend
            .createMany<
              Pick<ISessionTriggerRow, 'sessionId' | 'contentTriggerId'>
            >(
              config.triggersTable,
              uniqueTriggerIds.map((contentTriggerId) => ({
                [config.sessionIdKey]: sessionId,
                contentTriggerId,
              })) as Array<
                Pick<ISessionTriggerRow, 'sessionId' | 'contentTriggerId'>
              >,
            )
            .pipe(map(() => void 0));
        }),
      );
  }
}