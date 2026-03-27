import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap, throwError } from 'rxjs';

import { FilterOperator } from '../../enums/filter-operators';
import {
  IGmProfile,
  IGmProfileFormData,
  IGmProfileWithRelations,
} from '../../interfaces/i-gm-profile';
import { IGmProfileStyle, IGmStyle } from '../../interfaces/i-gm-style';
import { Auth } from '../auth/auth';
import { Backend } from '../backend/backend';
import { GmRead } from '../gm-read/gm-read';
import { IGmProfileLanguage, ILanguage } from '../../interfaces/i-languages';

@Injectable({ providedIn: 'root' })
export class GmProfileFacade {
  private readonly auth = inject(Auth);
  private readonly backend = inject(Backend);
  private readonly gmRead = inject(GmRead);

  getMyGmProfile(): Observable<IGmProfileWithRelations | null> {
    const userId = this.auth.userId();

    if (!userId) {
      return of(null);
    }

    return this.gmRead.getGmProfileWithRelationsById(userId);
  }

  getMyGmProfileRequired(): Observable<IGmProfileWithRelations> {
    return this.getMyGmProfile().pipe(
      switchMap((profile) => {
        if (!profile) {
          return throwError(() => new Error('GM profile not found.'));
        }

        return of(profile);
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

  getAvailableLanguages(): Observable<ILanguage[]> {
    return this.gmRead.getAvailableLanguages();
  }

  upsertMyGmProfile(
    payload: IGmProfileFormData,
  ): Observable<IGmProfileWithRelations> {
    const userId = this.auth.userId();

    if (!userId) {
      return throwError(() => new Error('Unauthorized.'));
    }

    return this.backend
      .upsert<
        Pick<
          IGmProfile,
          'id' | 'experience' | 'description' | 'image' | 'quote'
        >
      >('gm_profiles', {
        id: userId,
        experience: payload.experience,
        description: payload.description,
        image: payload.image,
        quote: payload.quote,
      })
      .pipe(
        switchMap(() =>
          forkJoin([
            this.replaceMyGmStyles(payload.gmStyleIds),
            this.replaceMyGmLanguages(payload.languageIds),
          ]),
        ),
        switchMap(() => this.getMyGmProfileRequired()),
      );
  }

  replaceMyGmStyles(gmStyleIds: string[]): Observable<void> {
    const userId = this.auth.userId();

    if (!userId) {
      return throwError(() => new Error('Unauthorized.'));
    }

    const uniqueStyleIds = [...new Set(gmStyleIds.filter(Boolean))];

    return this.backend
      .delete('gm_profile_styles', {
        gmProfileId: {
          operator: FilterOperator.EQ,
          value: userId,
        },
      })
      .pipe(
        switchMap(() => {
          if (!uniqueStyleIds.length) {
            return of(void 0);
          }

          return this.backend
            .createMany<Pick<IGmProfileStyle, 'gmProfileId' | 'gmStyleId'>>(
              'gm_profile_styles',
              uniqueStyleIds.map((gmStyleId) => ({
                gmProfileId: userId,
                gmStyleId,
              })),
            )
            .pipe(map(() => void 0));
        }),
      );
  }

  replaceMyGmLanguages(languageIds: string[]): Observable<void> {
    const userId = this.auth.userId();

    if (!userId) {
      return throwError(() => new Error('Unauthorized.'));
    }

    const uniqueLanguageIds = [...new Set(languageIds.filter(Boolean))];

    return this.backend
      .delete('gm_profile_languages', {
        gmProfileId: {
          operator: FilterOperator.EQ,
          value: userId,
        },
      })
      .pipe(
        switchMap(() => {
          if (!uniqueLanguageIds.length) {
            return of(void 0);
          }

          return this.backend
            .createMany<
              Pick<IGmProfileLanguage, 'gmProfileId' | 'languageId'>
            >(
              'gm_profile_languages',
              uniqueLanguageIds.map((languageId) => ({
                gmProfileId: userId,
                languageId,
              })),
            )
            .pipe(map(() => void 0));
        }),
      );
  }
}