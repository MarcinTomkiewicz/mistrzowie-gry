import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';

import { Backend } from '../backend/backend';
import { FilterOperator } from '../../enums/filter-operators';
import { IContentTrigger } from '../../interfaces/i-content-trigger';
import { IGmStyle } from '../../interfaces/i-gm-style';
import {
  ICustomSessionStyleRow,
  ICustomSessionTriggerRow,
  IGmSessionTemplateStyleRow,
  IGmSessionTemplateTriggerRow,
  ISession,
  ISessionWithRelations,
} from '../../interfaces/i-session';
import { ISystem } from '../../interfaces/i-system';

@Injectable({ providedIn: 'root' })
export class SessionRead {
  private readonly backend = inject(Backend);

  getSessionTemplatesByGmProfileId(
    gmProfileId: string,
  ): Observable<ISessionWithRelations[]> {
    return this.backend
      .getAll<ISession>({
        table: 'gm_session_templates',
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
            sessions.map((session) => this.hydrateTemplateSession(session)),
          );
        }),
        map((sessions) =>
          [...sessions].sort((a, b) => a.sortOrder - b.sortOrder),
        ),
      );
  }

  getSessionTemplateById(
    sessionId: string,
    gmProfileId?: string,
  ): Observable<ISessionWithRelations | null> {
    const fields = gmProfileId
      ? { id: sessionId, gmProfileId }
      : { id: sessionId };

    return this.backend
      .getOneByFields<ISession>('gm_session_templates', fields)
      .pipe(
        switchMap((session) => {
          if (!session) {
            return of(null);
          }

          return this.hydrateTemplateSession(session);
        }),
      );
  }

  getCustomSessionsByGmProfileId(
    gmProfileId: string,
  ): Observable<ISessionWithRelations[]> {
    return this.backend
      .getAll<ISession>({
        table: 'custom_sessions',
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
            sessions.map((session) => this.hydrateCustomSession(session)),
          );
        }),
        map((sessions) =>
          [...sessions].sort((a, b) => a.sortOrder - b.sortOrder),
        ),
      );
  }

  getCustomSessionById(
    sessionId: string,
    gmProfileId?: string,
  ): Observable<ISessionWithRelations | null> {
    const fields = gmProfileId
      ? { id: sessionId, gmProfileId }
      : { id: sessionId };

    return this.backend
      .getOneByFields<ISession>('custom_sessions', fields)
      .pipe(
        switchMap((session) => {
          if (!session) {
            return of(null);
          }

          return this.hydrateCustomSession(session);
        }),
      );
  }

  private hydrateTemplateSession(
    session: ISession,
  ): Observable<ISessionWithRelations> {
    return forkJoin({
      system: this.backend.getById<ISystem>('systems', session.systemId),
      styles: this.getTemplateSessionStyles(session.id),
      triggers: this.getTemplateSessionTriggers(session.id),
    }).pipe(
      map(({ system, styles, triggers }) => ({
        ...session,
        system: this.requireSystem(session, system),
        styles,
        triggers,
      })),
    );
  }

  private hydrateCustomSession(
    session: ISession,
  ): Observable<ISessionWithRelations> {
    return forkJoin({
      system: this.backend.getById<ISystem>('systems', session.systemId),
      styles: this.getCustomSessionStyles(session.id),
      triggers: this.getCustomSessionTriggers(session.id),
    }).pipe(
      map(({ system, styles, triggers }) => ({
        ...session,
        system: this.requireSystem(session, system),
        styles,
        triggers,
      })),
    );
  }

  private getTemplateSessionStyles(sessionId: string): Observable<IGmStyle[]> {
    return this.backend
      .getAll<IGmSessionTemplateStyleRow>({
        table: 'gm_session_template_styles',
        sortBy: 'createdAt',
        sortOrder: 'asc',
        pagination: {
          filters: {
            gmSessionTemplateId: {
              operator: FilterOperator.EQ,
              value: sessionId,
            },
          },
        },
      })
      .pipe(
        switchMap((rows) => {
          const gmStyleIds = [
            ...new Set(rows.map((row) => row.gmStyleId).filter(Boolean)),
          ];

          if (!gmStyleIds.length) {
            return of([] as IGmStyle[]);
          }

          return this.backend
            .getByIds<IGmStyle>('gm_styles', gmStyleIds)
            .pipe(
              map((styles) =>
                [...styles].sort((a, b) => a.sortOrder - b.sortOrder),
              ),
            );
        }),
      );
  }

  private getTemplateSessionTriggers(
    sessionId: string,
  ): Observable<IContentTrigger[]> {
    return this.backend
      .getAll<IGmSessionTemplateTriggerRow>({
        table: 'gm_session_template_triggers',
        sortBy: 'createdAt',
        sortOrder: 'asc',
        pagination: {
          filters: {
            gmSessionTemplateId: {
              operator: FilterOperator.EQ,
              value: sessionId,
            },
          },
        },
      })
      .pipe(
        switchMap((rows) => {
          const triggerIds = [
            ...new Set(rows.map((row) => row.contentTriggerId).filter(Boolean)),
          ];

          if (!triggerIds.length) {
            return of([] as IContentTrigger[]);
          }

          return this.backend
            .getByIds<IContentTrigger>('content_triggers', triggerIds)
            .pipe(
              map((triggers) =>
                [...triggers].sort((a, b) =>
                  a.label.localeCompare(b.label, 'pl'),
                ),
              ),
            );
        }),
      );
  }

  private getCustomSessionStyles(sessionId: string): Observable<IGmStyle[]> {
    return this.backend
      .getAll<ICustomSessionStyleRow>({
        table: 'custom_session_styles',
        sortBy: 'createdAt',
        sortOrder: 'asc',
        pagination: {
          filters: {
            customSessionId: {
              operator: FilterOperator.EQ,
              value: sessionId,
            },
          },
        },
      })
      .pipe(
        switchMap((rows) => {
          const gmStyleIds = [
            ...new Set(rows.map((row) => row.gmStyleId).filter(Boolean)),
          ];

          if (!gmStyleIds.length) {
            return of([] as IGmStyle[]);
          }

          return this.backend
            .getByIds<IGmStyle>('gm_styles', gmStyleIds)
            .pipe(
              map((styles) =>
                [...styles].sort((a, b) => a.sortOrder - b.sortOrder),
              ),
            );
        }),
      );
  }

  private getCustomSessionTriggers(
    sessionId: string,
  ): Observable<IContentTrigger[]> {
    return this.backend
      .getAll<ICustomSessionTriggerRow>({
        table: 'custom_session_triggers',
        sortBy: 'createdAt',
        sortOrder: 'asc',
        pagination: {
          filters: {
            customSessionId: {
              operator: FilterOperator.EQ,
              value: sessionId,
            },
          },
        },
      })
      .pipe(
        switchMap((rows) => {
          const triggerIds = [
            ...new Set(rows.map((row) => row.contentTriggerId).filter(Boolean)),
          ];

          if (!triggerIds.length) {
            return of([] as IContentTrigger[]);
          }

          return this.backend
            .getByIds<IContentTrigger>('content_triggers', triggerIds)
            .pipe(
              map((triggers) =>
                [...triggers].sort((a, b) =>
                  a.label.localeCompare(b.label, 'pl'),
                ),
              ),
            );
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
