import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';

import { FilterOperator } from '../../enums/filter-operators';
import { IContentTrigger } from '../../interfaces/i-content-trigger';
import {
  IGmProfile,
  IGmProfileWithRelations,
} from '../../interfaces/i-gm-profile';
import { IGmPublicProfile } from '../../interfaces/i-gm-public-profile';
import { IGmProfileStyle, IGmStyle } from '../../interfaces/i-gm-style';
import { ISession, ISessionWithRelations } from '../../interfaces/i-session';
import { ISystem } from '../../interfaces/i-system';
import { IUser } from '../../interfaces/i-user';
import { Backend } from '../backend/backend';
import { IGmProfileLanguage, ILanguage } from '../../interfaces/i-languages';

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
export class GmRead {
  private readonly backend = inject(Backend);

  getGmProfileWithRelationsById(
    gmProfileId: string,
  ): Observable<IGmProfileWithRelations | null> {
    return this.backend.getById<IGmProfile>('gm_profiles', gmProfileId).pipe(
      switchMap((profile) => {
        if (!profile) {
          return of(null);
        }

        return this.hydrateGmProfile(profile);
      }),
    );
  }

  getAvailableLanguages(): Observable<ILanguage[]> {
    return this.backend.getAll<ILanguage>({
      table: 'languages',
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
            sessions.map((session) => this.hydrateSessionTemplate(session)),
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

          return this.hydrateSessionTemplate(session);
        }),
      );
  }

  getPublicProfileById(
    gmProfileId: string,
  ): Observable<IGmPublicProfile | null> {
    return this.backend.getById<IGmProfile>('gm_profiles', gmProfileId).pipe(
      switchMap((profile) => {
        if (!profile?.isPublic) {
          return of(null);
        }

        return this.hydratePublicProfile(profile);
      }),
    );
  }

  getPublicProfiles(): Observable<IGmPublicProfile[]> {
    return this.backend
      .getAll<IGmProfile>({
        table: 'gm_profiles',
        sortBy: 'createdAt',
        sortOrder: 'asc',
        pagination: {
          filters: {
            isPublic: {
              operator: FilterOperator.EQ,
              value: true,
            },
          },
        },
      })
      .pipe(
        switchMap((profiles) => {
          if (!profiles.length) {
            return of([] as IGmPublicProfile[]);
          }

          return forkJoin(
            profiles.map((profile) => this.hydratePublicProfile(profile)),
          );
        }),
      );
  }

  getDisplayName(profile: IGmPublicProfile): string {
    const user = profile.user;

    if (user.useNickname && user.nickname?.trim()) {
      return user.nickname.trim();
    }

    if (user.firstName?.trim()) {
      return user.firstName.trim();
    }

    if (user.nickname?.trim()) {
      return user.nickname.trim();
    }

    return '';
  }

  private hydratePublicProfile(
    profile: IGmProfile,
  ): Observable<IGmPublicProfile> {
    return forkJoin({
      user: this.backend.getById<IUser>('users', profile.id),
      profileWithRelations: this.hydrateGmProfile(profile),
      sessions: this.getSessionTemplatesByGmProfileId(profile.id),
    }).pipe(
      map(({ user, profileWithRelations, sessions }) => ({
        user: user as IUser,
        profile: profileWithRelations,
        sessions,
      })),
    );
  }

  private hydrateGmProfile(
    profile: IGmProfile,
  ): Observable<IGmProfileWithRelations> {
    return forkJoin({
      styles: this.getGmProfileStyles(profile.id),
      languages: this.getGmProfileLanguages(profile.id),
    }).pipe(
      map(({ styles, languages }) => ({
        ...profile,
        styles,
        languages,
      })),
    );
  }

  private hydrateSessionTemplate(
    session: ISession,
  ): Observable<ISessionWithRelations> {
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

  private getGmProfileStyles(gmProfileId: string): Observable<IGmStyle[]> {
    return this.backend
      .getAll<IGmProfileStyle>({
        table: 'gm_profile_styles',
        sortBy: 'createdAt',
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
        switchMap((rows) => {
          const gmStyleIds = [
            ...new Set(rows.map((row) => row.gmStyleId).filter(Boolean)),
          ];

          if (!gmStyleIds.length) {
            return of([] as IGmStyle[]);
          }

          return this.backend.getByIds<IGmStyle>('gm_styles', gmStyleIds).pipe(
            map((styles) =>
              [...styles].sort((a, b) => a.sortOrder - b.sortOrder),
            ),
          );
        }),
      );
  }

  private getGmProfileLanguages(gmProfileId: string): Observable<ILanguage[]> {
    return this.backend
      .getAll<IGmProfileLanguage>({
        table: 'gm_profile_languages',
        sortBy: 'createdAt',
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
        switchMap((rows) => {
          const languageIds = [
            ...new Set(rows.map((row) => row.languageId).filter(Boolean)),
          ];

          if (!languageIds.length) {
            return of([] as ILanguage[]);
          }

          return this.backend.getByIds<ILanguage>('languages', languageIds).pipe(
            map((languages) =>
              [...languages].sort((a, b) => a.sortOrder - b.sortOrder),
            ),
          );
        }),
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
          const gmStyleIds = [
            ...new Set(rows.map((row) => row.gmStyleId).filter(Boolean)),
          ];

          if (!gmStyleIds.length) {
            return of([] as IGmStyle[]);
          }

          return this.backend.getByIds<IGmStyle>('gm_styles', gmStyleIds).pipe(
            map((styles) =>
              [...styles].sort((a, b) => a.sortOrder - b.sortOrder),
            ),
          );
        }),
      );
  }

  private getSessionTemplateTriggers(
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
}