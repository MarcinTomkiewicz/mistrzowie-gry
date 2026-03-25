import { inject, Injectable } from '@angular/core';
import { map, Observable, of, switchMap, throwError } from 'rxjs';

import { FilterOperator } from '../../enums/filter-operators';
import {
  IGmProfile,
  IGmProfileFormData,
  IGmProfileWithRelations,
} from '../../interfaces/i-gm-profile';
import { IGmProfileStyle, IGmStyle } from '../../interfaces/i-gm-style';
import { Auth } from '../auth/auth';
import { Backend } from '../backend/backend';

@Injectable({ providedIn: 'root' })
export class GmProfileFacade {
  private readonly auth = inject(Auth);
  private readonly backend = inject(Backend);

  getMyGmProfile(): Observable<IGmProfileWithRelations | null> {
    const userId = this.auth.userId();

    if (!userId) {
      return of(null);
    }

    return this.getGmProfileById(userId);
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

  upsertMyGmProfile(
    payload: IGmProfileFormData,
  ): Observable<IGmProfileWithRelations> {
    const userId = this.auth.userId();

    if (!userId) {
      return throwError(() => new Error('Unauthorized.'));
    }

    return this.backend
      .upsert<Pick<IGmProfile, 'id' | 'experience' | 'image' | 'quote'>>(
        'gm_profiles',
        {
          id: userId,
          experience: payload.experience,
          image: payload.image,
          quote: payload.quote,
        },
      )
      .pipe(
        switchMap(() => this.replaceMyGmStyles(payload.gmStyleIds)),
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

  private getGmProfileById(
    gmProfileId: string,
  ): Observable<IGmProfileWithRelations | null> {
    return this.backend.getById<IGmProfile>('gm_profiles', gmProfileId).pipe(
      switchMap((profile) => {
        if (!profile) {
          return of(null);
        }

        return this.getGmProfileStyles(gmProfileId).pipe(
          map((styles) => ({
            ...profile,
            styles,
          })),
        );
      }),
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
            return of([]);
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
}
