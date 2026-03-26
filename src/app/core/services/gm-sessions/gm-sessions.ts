import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap, throwError } from 'rxjs';

import { FilterOperator } from '../../enums/filter-operators';
import {
  ICreateSessionPayload,
  ISession,
  ISessionWithRelations,
  IUpdateSessionPayload,
} from '../../interfaces/i-session';
import { IContentTrigger } from '../../interfaces/i-content-trigger';
import { IGmStyle } from '../../interfaces/i-gm-style';
import { ISystem } from '../../interfaces/i-system';
import { Auth } from '../auth/auth';
import { Backend } from '../backend/backend';

interface IGmSessionTemplateRecord
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

interface IGmSessionTemplateStyleRow {
  gmSessionTemplateId: string;
  gmStyleId: string;
  createdAt: string | null;
}

interface IGmSessionTemplateTriggerRow {
  gmSessionTemplateId: string;
  contentTriggerId: string;
  createdAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class GmSessionsFacade {
  private readonly auth = inject(Auth);
  private readonly backend = inject(Backend);

  getMySessionTemplates(): Observable<ISessionWithRelations[]> {
    const userId = this.auth.userId();

    if (!userId) {
      return of([]);
    }

    return this.getSessionTemplatesByGmProfileId(userId);
  }

  getMySessionTemplateRequired(sessionId: string): Observable<ISessionWithRelations> {
    const userId = this.auth.userId();

    if (!userId) {
      return throwError(() => new Error('Unauthorized.'));
    }

    return this.getSessionTemplateById(sessionId, userId).pipe(
      switchMap((session) => {
        if (!session) {
          return throwError(() => new Error('Session template not found.'));
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

  createMySessionTemplate(
    payload: ICreateSessionPayload,
  ): Observable<ISessionWithRelations> {
    const userId = this.auth.userId();

    if (!userId) {
      return throwError(() => new Error('Unauthorized.'));
    }

    return this.backend
      .create<IGmSessionTemplateRecord>('gm_session_templates', {
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
            return throwError(() => new Error('Session template id was not returned.'));
          }

          return forkJoin([
            this.replaceSessionTemplateStyles(session.id, payload.gmStyleIds),
            this.replaceSessionTemplateTriggers(session.id, payload.triggerIds),
          ]).pipe(map(() => session.id as string));
        }),
        switchMap((sessionId) => this.getMySessionTemplateRequired(sessionId)),
      );
  }

  updateMySessionTemplate(
    sessionId: string,
    payload: IUpdateSessionPayload,
  ): Observable<ISessionWithRelations> {
    const userId = this.auth.userId();

    if (!userId) {
      return throwError(() => new Error('Unauthorized.'));
    }

    return this.getSessionTemplateById(sessionId, userId).pipe(
      switchMap((session) => {
        if (!session) {
          return throwError(() => new Error('Session template not found.'));
        }

        return this.backend.update<IGmSessionTemplateRecord>('gm_session_templates', sessionId, {
          systemId: payload.systemId,
          title: payload.title,
          description: payload.description,
          image: payload.image,
          difficultyLevel: payload.difficultyLevel,
          minPlayers: payload.minPlayers,
          maxPlayers: payload.maxPlayers,
          minAge: payload.minAge,
          sortOrder: payload.sortOrder ?? session.sortOrder,
        });
      }),
      switchMap(() =>
        forkJoin([
          this.replaceSessionTemplateStyles(sessionId, payload.gmStyleIds),
          this.replaceSessionTemplateTriggers(sessionId, payload.triggerIds),
        ]),
      ),
      switchMap(() => this.getMySessionTemplateRequired(sessionId)),
    );
  }

  deleteMySessionTemplate(sessionId: string): Observable<void> {
    const userId = this.auth.userId();

    if (!userId) {
      return throwError(() => new Error('Unauthorized.'));
    }

    return this.backend.delete('gm_session_templates', {
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

  replaceSessionTemplateStyles(
    sessionId: string,
    gmStyleIds: string[],
  ): Observable<void> {
    const uniqueStyleIds = [...new Set(gmStyleIds.filter(Boolean))];

    return this.backend
      .delete('gm_session_template_styles', {
        gmSessionTemplateId: {
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
            .createMany<Pick<IGmSessionTemplateStyleRow, 'gmSessionTemplateId' | 'gmStyleId'>>(
              'gm_session_template_styles',
              uniqueStyleIds.map((gmStyleId) => ({
                gmSessionTemplateId: sessionId,
                gmStyleId,
              })),
            )
            .pipe(map(() => void 0));
        }),
      );
  }

  replaceSessionTemplateTriggers(
    sessionId: string,
    triggerIds: string[],
  ): Observable<void> {
    const uniqueTriggerIds = [...new Set(triggerIds.filter(Boolean))];

    return this.backend
      .delete('gm_session_template_triggers', {
        gmSessionTemplateId: {
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
              Pick<IGmSessionTemplateTriggerRow, 'gmSessionTemplateId' | 'contentTriggerId'>
            >(
              'gm_session_template_triggers',
              uniqueTriggerIds.map((contentTriggerId) => ({
                gmSessionTemplateId: sessionId,
                contentTriggerId,
              })),
            )
            .pipe(map(() => void 0));
        }),
      );
  }

  private getSessionTemplatesByGmProfileId(
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
            return of([]);
          }

          return forkJoin(
            sessions.map((session) => this.hydrateSessionTemplate(session)),
          );
        }),
        map((sessions) =>
          [...sessions].sort((a, b) => a.sortOrder - b.sortOrder),
        ),
      );
  }

  private getSessionTemplateById(
    sessionId: string,
    gmProfileId: string,
  ): Observable<ISessionWithRelations | null> {
    return this.backend
      .getOneByFields<ISession>('gm_session_templates', {
        id: sessionId,
        gmProfileId,
      })
      .pipe(
        switchMap((session) => {
          if (!session) {
            return of(null);
          }

          return this.hydrateSessionTemplate(session);
        }),
      );
  }

  private hydrateSessionTemplate(session: ISession): Observable<ISessionWithRelations> {
    return forkJoin({
      system: this.backend.getById<ISystem>('systems', session.systemId),
      styles: this.getSessionTemplateStyles(session.id),
      triggers: this.getSessionTemplateTriggers(session.id),
    }).pipe(
      map(({ system, styles, triggers }) => ({
        ...session,
        system,
        styles,
        triggers,
      })),
    );
  }

  private getSessionTemplateStyles(sessionId: string): Observable<IGmStyle[]> {
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
          const gmStyleIds = [...new Set(rows.map((row) => row.gmStyleId).filter(Boolean))];

          if (!gmStyleIds.length) {
            return of([]);
          }

          return this.backend.getByIds<IGmStyle>('gm_styles', gmStyleIds).pipe(
            map((styles) => [...styles].sort((a, b) => a.sortOrder - b.sortOrder)),
          );
        }),
      );
  }

  private getSessionTemplateTriggers(sessionId: string): Observable<IContentTrigger[]> {
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
            return of([]);
          }

          return this.backend
            .getByIds<IContentTrigger>('content_triggers', triggerIds)
            .pipe(
              map((triggers) =>
                [...triggers].sort((a, b) => a.label.localeCompare(b.label, 'pl')),
              ),
            );
        }),
      );
  }
}