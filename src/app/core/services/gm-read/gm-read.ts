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
import { getUserDisplayName } from '../../utils/user-display';

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
            isArchived: {
              operator: FilterOperator.EQ,
              value: false,
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
            profiles.map((profile) => this.hydrateProfile(profile)),
          ).pipe(
            map((hydratedProfiles) =>
              hydratedProfiles.filter(
                (profile): profile is IGmPublicProfile => !!profile,
              ),
            ),
          );
        }),
      );
  }

  getDisplayName(profile: IGmPublicProfile): string {
    return getUserDisplayName(profile.user);
  }

  private hydrateProfile(
    profile: IGmProfile,
  ): Observable<IGmPublicProfile | null> {
    return forkJoin({
      user: this.backend.getById<IUser>('users', profile.id),
      profileWithRelations: this.hydrateGmProfile(profile),
      sessions: this.sessionRead.getSessionsByGmProfileId(profile.id, 'template'),
    }).pipe(
      map(({ user, profileWithRelations, sessions }) => {
        if (!user) {
          return null;
        }

        return {
          user,
          profile: profileWithRelations,
          sessions,
        };
      }),
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
