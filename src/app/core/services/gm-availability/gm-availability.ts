import { inject, Injectable } from '@angular/core';
import { Observable, of, switchMap, throwError, map } from 'rxjs';

import {
  IGmAvailabilityOverviewData,
  IGmAvailabilitySlotRecord,
  IGmAvailabilityWindowData,
} from '../../interfaces/i-gm-availability';
import { IGmProfile } from '../../interfaces/i-gm-profile';
import { FilterOperator } from '../../enums/filter-operators';
import { addDays } from '../../utils/date';
import { Auth } from '../auth/auth';
import { Backend } from '../backend/backend';

@Injectable({ providedIn: 'root' })
export class GmAvailability {
  private readonly auth = inject(Auth);
  private readonly backend = inject(Backend);

  getMyAvailability(
    fromIso: string,
    toIsoExclusive: string,
  ): Observable<IGmAvailabilityWindowData> {
    const userId = this.auth.userId();

    if (!userId) {
      return of({ editableRecords: [], adjacentRecords: [] });
    }

    const fromTimestamp = Date.parse(fromIso);
    const toTimestamp = Date.parse(toIsoExclusive);
    const contextFromIso = addDays(new Date(fromIso), -1).toISOString();
    const contextToIsoExclusive = addDays(
      new Date(toIsoExclusive),
      1,
    ).toISOString();

    return this.getAvailabilityForGmsOverlapping(
      [userId],
      contextFromIso,
      contextToIsoExclusive,
    ).pipe(
      map((records) => {
        const editableRecords: IGmAvailabilitySlotRecord[] = [];
        const adjacentRecords: IGmAvailabilitySlotRecord[] = [];

        for (const record of records) {
          const startsAt = Date.parse(record.startsAt);
          const target =
            startsAt >= fromTimestamp && startsAt < toTimestamp
              ? editableRecords
              : adjacentRecords;
          target.push(record);
        }

        return { editableRecords, adjacentRecords };
      }),
    );
  }

  getAvailabilityOverview(
    fromIso: string,
    toIsoExclusive: string,
  ): Observable<IGmAvailabilityOverviewData> {
    return this.backend.rpc<IGmAvailabilityOverviewData>(
      'get_admin_gm_availability_overview',
      { p_from: fromIso, p_to_exclusive: toIsoExclusive },
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
    });
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

    return this.ensureMyGmProfile(userId).pipe(
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

  private ensureMyGmProfile(userId: string): Observable<void> {
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
