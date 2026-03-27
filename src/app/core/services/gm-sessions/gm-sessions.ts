import { inject, Injectable } from '@angular/core';
import { map, Observable, of, switchMap, throwError } from 'rxjs';

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
import { GmRead } from '../gm-read/gm-read';

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
  private readonly gmRead = inject(GmRead);

  getMySessionTemplates(): Observable<ISessionWithRelations[]> {
    const userId = this.auth.userId();

    if (!userId) {
      return of([]);
    }

    return this.gmRead.getSessionTemplatesByGmProfileId(userId);
  }

  getMySessionTemplateRequired(
    sessionId: string,
  ): Observable<ISessionWithRelations> {
    const userId = this.auth.userId();

    if (!userId) {
      return throwError(() => new Error('Unauthorized.'));
    }

    return this.gmRead.getSessionTemplateById(sessionId, userId).pipe(
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

  getMySessionSystems(): Observable<ISystem[]> {
    const userId = this.auth.userId();

    if (!userId) {
      return of([]);
    }

    return this.getSessionSystemsByGmProfileId(userId);
  }

  getSessionSystemsByGmProfileId(gmProfileId: string): Observable<ISystem[]> {
    return this.backend
      .getAll<Pick<ISession, 'systemId'>>({
        table: 'gm_session_templates',
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
            return throwError(
              () => new Error('Session template id was not returned.'),
            );
          }

          return this.replaceSessionTemplateStyles(session.id, payload.gmStyleIds).pipe(
            switchMap(() =>
              this.replaceSessionTemplateTriggers(session.id as string, payload.triggerIds),
            ),
            map(() => session.id as string),
          );
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

    return this.gmRead.getSessionTemplateById(sessionId, userId).pipe(
      switchMap((session) => {
        if (!session) {
          return throwError(() => new Error('Session template not found.'));
        }

        return this.backend.update<IGmSessionTemplateRecord>(
          'gm_session_templates',
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
        );
      }),
      switchMap(() =>
        this.replaceSessionTemplateStyles(sessionId, payload.gmStyleIds).pipe(
          switchMap(() =>
            this.replaceSessionTemplateTriggers(sessionId, payload.triggerIds),
          ),
        ),
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
            .createMany<
              Pick<IGmSessionTemplateStyleRow, 'gmSessionTemplateId' | 'gmStyleId'>
            >(
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
              Pick<
                IGmSessionTemplateTriggerRow,
                'gmSessionTemplateId' | 'contentTriggerId'
              >
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
}