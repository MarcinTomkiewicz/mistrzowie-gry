import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';

import { FilterOperator } from '../../enums/filter-operators';
import { IContentTrigger } from '../../interfaces/i-content-trigger';
import { IGmStyle } from '../../interfaces/i-gm-style';
import {
  ICustomSessionCharacterSheetRow,
  ICustomSessionLanguageRow,
  ICustomSessionStyleRow,
  ICustomSessionTriggerRow,
  IGmSessionTemplateCharacterSheetRow,
  IGmSessionTemplateLanguageRow,
  IGmSessionTemplateStyleRow,
  IGmSessionTemplateTriggerRow,
  ISession,
  ISessionCharacterSheet,
  ISessionWithRelations,
} from '../../interfaces/i-session';
import { ILanguage } from '../../interfaces/i-languages';
import { ISystem } from '../../interfaces/i-system';
import { SessionSourceKind, SESSION_SOURCE_CONFIG } from '../../types/session-source';
import { Backend } from '../backend/backend';

type SessionStyleRow = IGmSessionTemplateStyleRow | ICustomSessionStyleRow;
type SessionTriggerRow = IGmSessionTemplateTriggerRow | ICustomSessionTriggerRow;
type SessionLanguageRow = IGmSessionTemplateLanguageRow | ICustomSessionLanguageRow;
type SessionCharacterSheetRow =
  | IGmSessionTemplateCharacterSheetRow
  | ICustomSessionCharacterSheetRow;

@Injectable({ providedIn: 'root' })
export class SessionRead {
  private readonly backend = inject(Backend);

  getSessionsByGmProfileId(
    gmProfileId: string,
    source: SessionSourceKind = 'template',
  ): Observable<ISessionWithRelations[]> {
    const config = SESSION_SOURCE_CONFIG[source];

    return this.backend
      .getAll<ISession>({
        table: config.sessionsTable,
        sortBy: 'sortOrder',
        sortOrder: 'asc',
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
          if (!sessions.length) {
            return of([] as ISessionWithRelations[]);
          }

          return forkJoin(
            sessions.map((session) => this.hydrateSession(session, source)),
          );
        }),
        map((sessions) =>
          [...sessions].sort((a, b) => a.sortOrder - b.sortOrder),
        ),
      );
  }

  getSessionById(
    sessionId: string,
    source: SessionSourceKind = 'template',
    gmProfileId?: string,
  ): Observable<ISessionWithRelations | null> {
    const config = SESSION_SOURCE_CONFIG[source];
    const filters = gmProfileId ? { id: sessionId, gmProfileId } : { id: sessionId };

    return this.backend
      .getOneByFields<ISession>(config.sessionsTable, filters)
      .pipe(
        switchMap((session) => {
          if (!session) {
            return of(null);
          }

          return this.hydrateSession(session, source);
        }),
      );
  }

  private hydrateSession(
    session: ISession,
    source: SessionSourceKind,
  ): Observable<ISessionWithRelations> {
    return forkJoin({
      system: this.backend.getById<ISystem>('systems', session.systemId),
      styles: this.getSessionStyles(session.id, source),
      triggers: this.getSessionTriggers(session.id, source),
      languages: this.getSessionLanguages(session.id, source),
      characterSheets: this.getSessionCharacterSheets(session.id, source),
    }).pipe(
      map(({ system, styles, triggers, languages, characterSheets }) => ({
        ...session,
        system: this.requireSystem(session, system),
        styles,
        triggers,
        languages,
        characterSheets,
      })),
    );
  }

  private getSessionStyles(
    sessionId: string,
    source: SessionSourceKind,
  ): Observable<IGmStyle[]> {
    return this.getLinkedEntities<SessionStyleRow, IGmStyle>(
      sessionId,
      source,
      SESSION_SOURCE_CONFIG[source].stylesTable,
      'gmStyleId',
      'gm_styles',
      (items) => [...items].sort((a, b) => a.sortOrder - b.sortOrder),
    );
  }

  private getSessionTriggers(
    sessionId: string,
    source: SessionSourceKind,
  ): Observable<IContentTrigger[]> {
    return this.getLinkedEntities<SessionTriggerRow, IContentTrigger>(
      sessionId,
      source,
      SESSION_SOURCE_CONFIG[source].triggersTable,
      'contentTriggerId',
      'content_triggers',
      (items) =>
        [...items].sort((a, b) => a.label.localeCompare(b.label, 'pl')),
    );
  }

  private getSessionLanguages(
    sessionId: string,
    source: SessionSourceKind,
  ): Observable<ILanguage[]> {
    return this.getLinkedEntities<SessionLanguageRow, ILanguage>(
      sessionId,
      source,
      SESSION_SOURCE_CONFIG[source].languagesTable,
      'languageId',
      'languages',
      (items) => [...items].sort((a, b) => a.sortOrder - b.sortOrder),
    );
  }

  private getSessionCharacterSheets(
    sessionId: string,
    source: SessionSourceKind,
  ): Observable<ISessionCharacterSheet[]> {
    const config = SESSION_SOURCE_CONFIG[source];

    return this.backend
      .getAll<SessionCharacterSheetRow>({
        table: config.characterSheetsTable,
        sortBy: 'createdAt',
        sortOrder: 'asc',
        pagination: {
          filters: {
            [config.sessionIdKey]: {
              operator: FilterOperator.EQ,
              value: sessionId,
            },
          },
        },
      })
      .pipe(
        map((rows) =>
          rows.map((row) => ({
            id: row.id,
            storagePath: row.storagePath,
            fileName: row.fileName,
            createdAt: row.createdAt,
          })),
        ),
      );
  }

  private getLinkedEntities<TRow extends object, TEntity extends { id: string }>(
    sessionId: string,
    source: SessionSourceKind,
    relationTable: string,
    relationIdKey: string,
    entityTable: string,
    sort: (items: TEntity[]) => TEntity[],
  ): Observable<TEntity[]> {
    const config = SESSION_SOURCE_CONFIG[source];

    return this.backend
      .getAll<TRow>({
        table: relationTable,
        sortBy: 'createdAt' as keyof TRow,
        sortOrder: 'asc',
        pagination: {
          filters: {
            [config.sessionIdKey]: {
              operator: FilterOperator.EQ,
              value: sessionId,
            },
          },
        },
      })
      .pipe(
        switchMap((rows) => {
          const ids = [
            ...new Set(
              rows.reduce<string[]>((acc, row) => {
                const value = row[relationIdKey as keyof TRow];

                if (typeof value === 'string' && value) {
                  acc.push(value);
                }

                return acc;
              }, []),
            ),
          ];

          if (!ids.length) {
            return of([] as TEntity[]);
          }

          return this.backend
            .getByIds<TEntity>(entityTable, ids)
            .pipe(map((items) => sort(items)));
        }),
      );
  }

  private requireSystem(session: ISession, system: ISystem | null): ISystem {
    if (system) {
      return system;
    }

    throw new Error(
      `[SESSION_READ] Missing system for session "${session.id}" with systemId "${session.systemId}"`,
    );
  }
}
