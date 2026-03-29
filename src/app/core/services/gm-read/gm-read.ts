import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';

import { FilterOperator } from '../../enums/filter-operators';
import {
  IGmProfile,
  IGmProfileWithRelations,
} from '../../interfaces/i-gm-profile';
import { IGmPublicProfile } from '../../interfaces/i-gm-public-profile';
import { IGmProfileStyle, IGmStyle } from '../../interfaces/i-gm-style';
import { IUser } from '../../interfaces/i-user';
import { Backend } from '../backend/backend';
import { IGmProfileLanguage, ILanguage } from '../../interfaces/i-languages';
import { SessionRead } from '../session-read/session-read';

@Injectable({ providedIn: 'root' })
export class GmRead {
  private readonly backend = inject(Backend);
  private readonly sessionRead = inject(SessionRead);

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

  getProfileById(gmProfileId: string): Observable<IGmPublicProfile | null> {
    return this.backend.getById<IGmProfile>('gm_profiles', gmProfileId).pipe(
      switchMap((profile) => {
        if (!profile) {
          return of(null);
        }

        return this.hydrateProfile(profile);
      }),
    );
  }

  getPublicProfileById(
    gmProfileId: string,
  ): Observable<IGmPublicProfile | null> {
    return this.getProfileById(gmProfileId).pipe(
      map((profile) => {
        if (!profile?.profile.isPublic) {
          return null;
        }

        return profile;
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

  getSessionTemplatesByGmProfileId(gmProfileId: string) {
    return this.sessionRead.getSessionTemplatesByGmProfileId(gmProfileId);
  }

  getSessionTemplateById(sessionId: string, gmProfileId?: string) {
    return this.sessionRead.getSessionTemplateById(sessionId, gmProfileId);
  }

  getCustomSessionsByGmProfileId(gmProfileId: string) {
    return this.sessionRead.getCustomSessionsByGmProfileId(gmProfileId);
  }

  getCustomSessionById(sessionId: string, gmProfileId?: string) {
    return this.sessionRead.getCustomSessionById(sessionId, gmProfileId);
  }

  getPublicProfiles(): Observable<IGmPublicProfile[]> {
    return this.backend
      .getAll<IGmProfile>({
        table: 'gm_profiles',
        sortBy: 'createdAt',
        sortOrder: 'asc',
      })
      .pipe(
        switchMap((profiles) => {
          if (!profiles.length) {
            return of([] as IGmPublicProfile[]);
          }

          const publicProfiles = profiles.filter((profile) => profile.isPublic);

          if (!publicProfiles.length) {
            return of([] as IGmPublicProfile[]);
          }

          return forkJoin(
            publicProfiles.map((profile) => this.hydrateProfile(profile)),
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

  private hydrateProfile(profile: IGmProfile): Observable<IGmPublicProfile> {
    return forkJoin({
      user: this.backend.getById<IUser>('users', profile.id),
      profileWithRelations: this.hydrateGmProfile(profile),
      sessions: this.sessionRead.getSessionTemplatesByGmProfileId(profile.id),
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

          return this.backend
            .getByIds<ILanguage>('languages', languageIds)
            .pipe(
              map((languages) =>
                [...languages].sort((a, b) => a.sortOrder - b.sortOrder),
              ),
            );
        }),
      );
  }
}