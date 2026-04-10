import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap, throwError } from 'rxjs';

import { FilterOperator } from '../../enums/filter-operators';
import { IContentTrigger } from '../../interfaces/i-content-trigger';
import { IGmStyle } from '../../interfaces/i-gm-style';
import { ILanguage } from '../../interfaces/i-languages';
import {
  ISession,
  ISessionFormSubmitData,
  ISessionWithRelations,
} from '../../interfaces/i-session';
import { ISystem } from '../../interfaces/i-system';
import { SessionSourceKind, SESSION_SOURCE_CONFIG } from '../../types/session-source';
import { Auth } from '../auth/auth';
import { Backend } from '../backend/backend';
import { GmRead } from '../gm-read/gm-read';
import { SessionRead } from '../session-read/session-read';
import { Storage } from '../storage/storage';

type SessionLinkKey = 'gmStyleId' | 'contentTriggerId' | 'languageId';

type SessionRecord = Pick<
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
  | 'hasReadyCharacterSheets'
  | 'allowsScenarioCustomization'
  | 'sortOrder'
> & { id?: string };

@Injectable({ providedIn: 'root' })
export class GmSessionsFacade {
  private readonly auth = inject(Auth);
  private readonly backend = inject(Backend);
  private readonly gmRead = inject(GmRead);
  private readonly sessionRead = inject(SessionRead);
  private readonly storage = inject(Storage);

  getMySessions(
    source: SessionSourceKind = 'template',
  ): Observable<ISessionWithRelations[]> {
    const userId = this.auth.userId();

    if (!userId) {
      return of([]);
    }

    return this.sessionRead.getSessionsByGmProfileId(userId, source);
  }

  getMySessionRequired(
    sessionId: string,
    source: SessionSourceKind = 'template',
  ): Observable<ISessionWithRelations> {
    const userId = this.auth.userId();

    if (!userId) {
      return throwError(() => new Error('Unauthorized.'));
    }

    return this.sessionRead.getSessionById(sessionId, source, userId).pipe(
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

  getAvailableLanguages(): Observable<ILanguage[]> {
    return this.gmRead.getAvailableLanguages();
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

  createMySession(
    submit: ISessionFormSubmitData,
    source: SessionSourceKind = 'template',
  ): Observable<ISessionWithRelations> {
    return this.saveMySession(submit, source);
  }

  updateMySession(
    sessionId: string,
    submit: ISessionFormSubmitData,
    source: SessionSourceKind = 'template',
  ): Observable<ISessionWithRelations> {
    return this.saveMySession(submit, source, sessionId);
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

    return this.getMySessionRequired(sessionId, source).pipe(
      switchMap(() => this.storage.removeSessionCharacterSheets(sessionId, source)),
      switchMap(() =>
        this.backend.delete(config.sessionsTable, {
          id: {
            operator: FilterOperator.EQ,
            value: sessionId,
          },
          gmProfileId: {
            operator: FilterOperator.EQ,
            value: userId,
          },
        }),
      ),
    );
  }

  private saveMySession(
    submit: ISessionFormSubmitData,
    source: SessionSourceKind,
    sessionId?: string,
  ): Observable<ISessionWithRelations> {
    const userId = this.auth.userId();
    const config = SESSION_SOURCE_CONFIG[source];
    const payload = submit.payload;

    if (!userId) {
      return throwError(() => new Error('Unauthorized.'));
    }

    const saveRecord$ = sessionId
      ? this.backend.update<SessionRecord>(config.sessionsTable, sessionId, {
          systemId: payload.systemId,
          title: payload.title,
          description: payload.description,
          image: payload.image,
          difficultyLevel: payload.difficultyLevel,
          minPlayers: payload.minPlayers,
          maxPlayers: payload.maxPlayers,
          minAge: payload.minAge,
          hasReadyCharacterSheets: payload.hasReadyCharacterSheets,
          allowsScenarioCustomization: payload.allowsScenarioCustomization,
          sortOrder: payload.sortOrder ?? 0,
        })
      : this.backend.create<SessionRecord>(config.sessionsTable, {
          gmProfileId: userId,
          systemId: payload.systemId,
          title: payload.title,
          description: payload.description,
          image: payload.image,
          difficultyLevel: payload.difficultyLevel,
          minPlayers: payload.minPlayers,
          maxPlayers: payload.maxPlayers,
          minAge: payload.minAge,
          hasReadyCharacterSheets: payload.hasReadyCharacterSheets,
          allowsScenarioCustomization: payload.allowsScenarioCustomization,
          sortOrder: payload.sortOrder ?? 0,
        });

    return saveRecord$.pipe(
      map((session) => session.id ?? sessionId ?? ''),
      switchMap((savedSessionId) => {
        if (!savedSessionId) {
          return throwError(() => new Error('Session id was not returned.'));
        }

        return forkJoin([
          this.replaceSessionLinks(savedSessionId, source, config.stylesTable, 'gmStyleId', payload.gmStyleIds),
          this.replaceSessionLinks(
            savedSessionId,
            source,
            config.triggersTable,
            'contentTriggerId',
            payload.triggerIds,
          ),
          this.replaceSessionLinks(
            savedSessionId,
            source,
            config.languagesTable,
            'languageId',
            payload.languageIds,
          ),
          this.storage.syncSessionCharacterSheets(
            savedSessionId,
            source,
            userId,
            payload.hasReadyCharacterSheets ? submit.newCharacterSheetFiles : [],
            payload.hasReadyCharacterSheets ? submit.removedCharacterSheetIds : [],
          ),
        ]).pipe(map(() => savedSessionId));
      }),
      switchMap((savedSessionId) => {
        if (!payload.hasReadyCharacterSheets) {
          return this.storage.removeSessionCharacterSheets(savedSessionId, source).pipe(
            switchMap(() => this.getMySessionRequired(savedSessionId, source)),
          );
        }

        return this.getMySessionRequired(savedSessionId, source);
      }),
    );
  }

  private replaceSessionLinks(
    sessionId: string,
    source: SessionSourceKind,
    table: string,
    relatedKey: SessionLinkKey,
    ids: readonly string[],
  ): Observable<void> {
    const config = SESSION_SOURCE_CONFIG[source];
    const uniqueIds = [...new Set(ids.filter(Boolean))];

    return this.backend
      .delete(table, {
        [config.sessionIdKey]: {
          operator: FilterOperator.EQ,
          value: sessionId,
        },
      })
      .pipe(
        switchMap(() => {
          if (!uniqueIds.length) {
            return of(void 0);
          }

          return this.backend
            .createMany<Record<string, string>>(
              table,
              uniqueIds.map((id) => ({
                [config.sessionIdKey]: sessionId,
                [relatedKey]: id,
              })),
            )
            .pipe(map(() => void 0));
        }),
      );
  }
}
