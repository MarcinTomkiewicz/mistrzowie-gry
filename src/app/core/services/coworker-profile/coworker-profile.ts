import { inject, Injectable } from '@angular/core';
import { map, Observable, of, switchMap, throwError } from 'rxjs';

import { FilterOperator } from '../../enums/filter-operators';
import { ICoworkerProfile } from '../../interfaces/i-coworker-profile';
import { Auth } from '../auth/auth';
import { Backend } from '../backend/backend';

@Injectable({ providedIn: 'root' })
export class CoworkerProfile {
  private readonly auth = inject(Auth);
  private readonly backend = inject(Backend);

  getMyProfile(): Observable<ICoworkerProfile | null> {
    const userId = this.auth.userId();

    if (!userId) {
      return of(null);
    }

    return this.getProfileByUserId(userId);
  }

  getProfileByUserId(userId: string): Observable<ICoworkerProfile | null> {
    return this.backend.getOneByFields<ICoworkerProfile>('coworker_profiles', {
      userId,
    });
  }

  getProfilesByUserIds(userIds: readonly string[]): Observable<ICoworkerProfile[]> {
    if (!userIds.length) {
      return of([]);
    }

    return this.backend.getAll<ICoworkerProfile>({
      table: 'coworker_profiles',
      sortBy: 'firstName',
      sortOrder: 'asc',
      pagination: {
        filters: {
          userId: {
            operator: FilterOperator.IN,
            value: [...userIds],
          },
        },
      },
    });
  }

  upsertMyProfile(payload: Pick<ICoworkerProfile, 'firstName' | 'lastName'>): Observable<ICoworkerProfile> {
    const userId = this.auth.userId();

    if (!userId) {
      return throwError(() => new Error('Unauthorized.'));
    }

    return this.getProfileByUserId(userId).pipe(
      switchMap((currentProfile) =>
        this.backend.upsert<ICoworkerProfile>(
          'coworker_profiles',
          {
            ...(currentProfile ?? {}),
            userId,
            firstName: payload.firstName.trim(),
            lastName: payload.lastName.trim(),
            updatedAt: new Date().toISOString(),
          },
          'user_id',
        ),
      ),
      map((profile) => ({
        ...profile,
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
      })),
    );
  }
}
