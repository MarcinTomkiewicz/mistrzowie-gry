import { inject, Injectable } from '@angular/core';
import { map, Observable, of, switchMap, throwError } from 'rxjs';

import { FilterOperator } from '../../enums/filter-operators';
import { IUser } from '../../interfaces/i-user';
import {
  IUserWorkLogDay,
  IUserWorkLogRecord,
  WorkLogMonthOffset,
} from '../../interfaces/i-work-log';
import {
  getWorkLogMonthScope,
  mapWorkLogDaysToRangeRecords,
  mapWorkLogDaysToRecords,
  mapWorkLogRecordsToDays,
} from '../../utils/work-log/work-log.util';
import { Auth } from '../auth/auth';
import { Backend } from '../backend/backend';

const WORK_LOG_ALLOWED_ROLES = [
  'gm',
  'marketing_manager',
  'customer_manager',
  'lead_coordinator',
  'admin',
] as const satisfies readonly IUser['appRole'][];

@Injectable({ providedIn: 'root' })
export class WorkLog {
  private readonly auth = inject(Auth);
  private readonly backend = inject(Backend);

  getMyMonth(monthOffset: WorkLogMonthOffset): Observable<IUserWorkLogDay[]> {
    const userId = this.auth.userId();

    if (!userId) {
      return of([]);
    }

    return this.getMonthForUser(userId, monthOffset);
  }

  getMonthForUser(
    userId: string,
    monthOffset: WorkLogMonthOffset,
  ): Observable<IUserWorkLogDay[]> {
    const scope = getWorkLogMonthScope(monthOffset);

    return this.backend
      .getAll<IUserWorkLogRecord>({
        table: 'user_work_log',
        joins: 'user_work_log_ranges(*)',
        sortBy: 'workDate',
        sortOrder: 'asc',
        pagination: {
          filters: {
            userId: {
              operator: FilterOperator.EQ,
              value: userId,
            },
            workDate: [
              {
                operator: FilterOperator.GTE,
                value: scope.startDate,
              },
              {
                operator: FilterOperator.LTE,
                value: scope.endDate,
              },
            ],
          },
        },
      })
      .pipe(map((records) => mapWorkLogRecordsToDays(records)));
  }

  getWorkLogUsers(): Observable<IUser[]> {
    return this.backend.getAll<IUser>({
      table: 'users',
      sortBy: 'createdAt',
      sortOrder: 'asc',
      pagination: {
        filters: {
          appRole: {
            operator: FilterOperator.IN,
            value: [...WORK_LOG_ALLOWED_ROLES],
          },
        },
      },
    });
  }

  getMonthForUsers(
    userIds: readonly string[],
    monthOffset: WorkLogMonthOffset,
  ): Observable<IUserWorkLogRecord[]> {
    if (!userIds.length) {
      return of([]);
    }

    const scope = getWorkLogMonthScope(monthOffset);

    return this.backend.getAll<IUserWorkLogRecord>({
      table: 'user_work_log',
      joins: 'user_work_log_ranges(*)',
      sortBy: 'workDate',
      sortOrder: 'asc',
      pagination: {
        filters: {
          userId: {
            operator: FilterOperator.IN,
            value: [...userIds],
          },
          workDate: [
            {
              operator: FilterOperator.GTE,
              value: scope.startDate,
            },
            {
              operator: FilterOperator.LTE,
              value: scope.endDate,
            },
          ],
        },
      },
    });
  }

  getOverview(monthOffset: WorkLogMonthOffset): Observable<{
    users: IUser[];
    records: IUserWorkLogRecord[];
  }> {
    return this.getWorkLogUsers().pipe(
      switchMap((users) => {
        if (!users.length) {
          return of({
            users,
            records: [] as IUserWorkLogRecord[],
          });
        }

        return this.getMonthForUsers(
          users.map((user) => user.id),
          monthOffset,
        ).pipe(
          map((records) => ({
            users,
            records,
          })),
        );
      }),
    );
  }

  replaceMyMonth(
    days: readonly IUserWorkLogDay[],
    monthOffset: WorkLogMonthOffset,
  ): Observable<IUserWorkLogDay[]> {
    const userId = this.auth.userId();

    if (!userId) {
      return throwError(() => new Error('Unauthorized.'));
    }

    return this.replaceMonthForUser(userId, days, monthOffset);
  }

  private replaceMonthForUser(
    userId: string,
    days: readonly IUserWorkLogDay[],
    monthOffset: WorkLogMonthOffset,
  ): Observable<IUserWorkLogDay[]> {
    const scope = getWorkLogMonthScope(monthOffset);

    return this.backend
      .delete('user_work_log', {
        userId: {
          operator: FilterOperator.EQ,
          value: userId,
        },
        workDate: [
          {
            operator: FilterOperator.GTE,
            value: scope.startDate,
          },
          {
            operator: FilterOperator.LTE,
            value: scope.endDate,
          },
        ],
      })
      .pipe(
        switchMap(() => {
          const records = mapWorkLogDaysToRecords(userId, days);

          if (!records.length) {
            return of([] as IUserWorkLogDay[]);
          }

          return this.backend
            .createMany<IUserWorkLogRecord>('user_work_log', records)
            .pipe(
              switchMap((savedDays) => {
                const rangeRecords = mapWorkLogDaysToRangeRecords(savedDays, days);

                if (!rangeRecords.length) {
                  return of(savedDays);
                }

                return this.backend
                  .createMany('user_work_log_ranges', rangeRecords)
                  .pipe(map(() => savedDays));
              }),
              map((savedDays) =>
                mapWorkLogRecordsToDays(
                  savedDays.map((savedDay) => ({
                    ...savedDay,
                    userWorkLogRanges: mapWorkLogDaysToRangeRecords(
                      [savedDay],
                      days,
                    ),
                  })),
                ),
              ),
            );
        }),
      );
  }
}
