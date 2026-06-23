import { inject, Injectable } from '@angular/core';
import { Observable, of, switchMap, throwError, map } from 'rxjs';

import { IGmAvailabilitySlotRecord } from '../../interfaces/i-gm-availability';
import { IGmProfile } from '../../interfaces/i-gm-profile';
import { IUser } from '../../interfaces/i-user';
import { FilterOperator } from '../../enums/filter-operators';
import { Auth } from '../auth/auth';
import { Backend } from '../backend/backend';

@Injectable({ providedIn: 'root' })
export class GmAvailability {
  private readonly auth = inject(Auth);
  private readonly backend = inject(Backend);

  getMyAvailability(
    fromIso: string,
    toIsoExclusive: string,
  ): Observable<IGmAvailabilitySlotRecord[]> {
    const userId = this.auth.userId();

    if (!userId) {
      return of([]);
    }

    return this.backend.getAll<IGmAvailabilitySlotRecord>({
      table: 'gm_availability_slots',
      sortBy: 'startsAt',
      sortOrder: 'asc',
      pagination: {
        filters: {
          gmProfileId: {
            operator: FilterOperator.EQ,
            value: userId,
          },
          startsAt: [
            {
              operator: FilterOperator.GTE,
              value: fromIso,
            },
            {
              operator: FilterOperator.LT,
              value: toIsoExclusive,
            },
          ],
        },
      },
    });
  }

  getGmUsers(): Observable<IUser[]> {
    return this.backend
      .getAll<IGmProfile>({
        table: 'gm_profiles',
        sortBy: 'createdAt',
        sortOrder: 'asc',
        pagination: {
          filters: {
            isArchived: {
              operator: FilterOperator.EQ,
              value: false,
            },
          },
        },
      })
      .pipe(
        switchMap((profiles) => {
          const gmProfileIds = [
            ...new Set(profiles.map((profile) => profile.id).filter(Boolean)),
          ];

          if (!gmProfileIds.length) {
            return of([] as IUser[]);
          }

          return this.backend.getByIds<IUser>('users', gmProfileIds);
        }),
      );
  }

  getAvailabilityForGms(
    gmProfileIds: readonly string[],
    fromIso: string,
    toIsoExclusive: string,
  ): Observable<IGmAvailabilitySlotRecord[]> {
    if (!gmProfileIds.length) {
      return of([]);
    }

    return this.backend.getAll<IGmAvailabilitySlotRecord>({
      table: 'gm_availability_slots',
      sortBy: 'startsAt',
      sortOrder: 'asc',
      pagination: {
        filters: {
          gmProfileId: {
            operator: FilterOperator.IN,
            value: [...gmProfileIds],
          },
          startsAt: [
            {
              operator: FilterOperator.GTE,
              value: fromIso,
            },
            {
              operator: FilterOperator.LT,
              value: toIsoExclusive,
            },
          ],
        },
      },
    }).pipe(
      map((records) =>
        [...records].sort((left, right) => left.startsAt.localeCompare(right.startsAt)),
      ),
    );
  }

  getAvailabilityOverview(
    fromIso: string,
    toIsoExclusive: string,
  ): Observable<{
    gmUsers: IUser[];
    records: IGmAvailabilitySlotRecord[];
  }> {
    return this.getGmUsers().pipe(
      switchMap((gmUsers) => {
        if (!gmUsers.length) {
          return of({
            gmUsers,
            records: [] as IGmAvailabilitySlotRecord[],
          });
        }

        return this.getAvailabilityForGms(
          gmUsers.map((user) => user.id),
          fromIso,
          toIsoExclusive,
        ).pipe(
          map((records) => ({
            gmUsers,
            records,
          })),
        );
      }),
    );
  }

  getAvailabilityForGmsOverlapping(
    gmProfileIds: readonly string[],
    fromIso: string,
    toIsoExclusive: string,
  ): Observable<IGmAvailabilitySlotRecord[]> {
    if (!gmProfileIds.length) {
      return of([]);
    }

    return this.backend.getAll<IGmAvailabilitySlotRecord>({
      table: 'gm_availability_slots',
      sortBy: 'startsAt',
      sortOrder: 'asc',
      pagination: {
        filters: {
          gmProfileId: {
            operator: FilterOperator.IN,
            value: [...gmProfileIds],
          },
          startsAt: {
            operator: FilterOperator.LT,
            value: toIsoExclusive,
          },
          endsAt: {
            operator: FilterOperator.GT,
            value: fromIso,
          },
        },
      },
    }).pipe(
      map((records) =>
        [...records].sort((left, right) => left.startsAt.localeCompare(right.startsAt)),
      ),
    );
  }

  replaceMyAvailability(
    records: readonly IGmAvailabilitySlotRecord[],
    fromIso: string,
    toIsoExclusive: string,
  ): Observable<IGmAvailabilitySlotRecord[]> {
    const userId = this.auth.userId();

    if (!userId) {
      return throwError(() => new Error('Unauthorized.'));
    }

    return this.ensureMyGmProfile().pipe(
      switchMap(() =>
        this.backend.delete('gm_availability_slots', {
          gmProfileId: {
            operator: FilterOperator.EQ,
            value: userId,
          },
          startsAt: [
            {
              operator: FilterOperator.GTE,
              value: fromIso,
            },
            {
              operator: FilterOperator.LT,
              value: toIsoExclusive,
            },
          ],
        }),
      ),
      switchMap(() => {
        if (!records.length) {
          return of([]);
        }

        const payload = records.map(({ startsAt, endsAt }) => ({
          gmProfileId: userId,
          startsAt,
          endsAt,
        }));

        return this.backend
          .createMany<IGmAvailabilitySlotRecord>(
            'gm_availability_slots',
            payload,
          )
          .pipe(
            map((savedRecords) =>
              [...savedRecords].sort((left, right) =>
                left.startsAt.localeCompare(right.startsAt),
              ),
            ),
          );
      }),
    );
  }

  private ensureMyGmProfile(): Observable<void> {
    const userId = this.auth.userId();

    if (!userId) {
      return throwError(() => new Error('Unauthorized.'));
    }

    return this.backend.getById<IGmProfile>('gm_profiles', userId).pipe(
      switchMap((profile) => {
        if (profile) {
          return of(void 0);
        }

        return this.backend.create<
          Pick<IGmProfile, 'id' | 'isPublic' | 'isArchived'>
        >('gm_profiles', {
          id: userId,
          isPublic: false,
          isArchived: false,
        }).pipe(map(() => void 0));
      }),
    );
  }
}
