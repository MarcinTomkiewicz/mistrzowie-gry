import { inject, Injectable } from '@angular/core';
import { map, Observable, of, switchMap, throwError } from 'rxjs';

import { FilterOperator } from '../../enums/filter-operators';
import { IUser } from '../../interfaces/i-user';
import {
  IWorkLogOverviewData,
  IUserWorkLogDay,
  IUserWorkLogMonthData,
  IUserWorkLogRecord,
} from '../../interfaces/i-work-log';
import { WorkLogMonthOffset } from '../../types/work-log';
import {
  mapWorkLogDaysToRangeRecords,
  mapWorkLogDaysToRecords,
  mapWorkLogRecordsToDays,
} from '../../domain/work-log/mapping';
import { getWorkLogMonthScope } from '../../domain/work-log/rules';
import { addDays, parseIsoDate, toIsoDate } from '../../utils/date';
import { getRolesAtOrAbove } from '../../utils/roles';
import { Auth } from '../auth/auth';
import { Backend } from '../backend/backend';

@Injectable({ providedIn: 'root' })
export class WorkLog {
  private readonly auth = inject(Auth);
  private readonly backend = inject(Backend);

  getMyMonth(
    monthOffset: WorkLogMonthOffset,
  ): Observable<IUserWorkLogMonthData> {
    const userId = this.auth.userId();

    if (!userId) {
      return of({ days: [], adjacentDays: [] });
    }

    return this.getMonthForUser(userId, monthOffset);
  }

  private getMonthForUser(
    userId: string,
    monthOffset: WorkLogMonthOffset,
  ): Observable<IUserWorkLogMonthData> {
    const scope = getWorkLogMonthScope(monthOffset);
    const contextStartDate = toIsoDate(
      addDays(parseIsoDate(scope.startDate)!, -1),
    );
    const contextEndDate = toIsoDate(
      addDays(parseIsoDate(scope.endDate)!, 1),
    );

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
                value: contextStartDate,
              },
              {
                operator: FilterOperator.LTE,
                value: contextEndDate,
              },
            ],
          },
        },
      })
      .pipe(
        map((records) => {
          const contextDays = mapWorkLogRecordsToDays(records);

          return {
            days: contextDays.filter(
              (day) =>
                day.date >= scope.startDate && day.date <= scope.endDate,
            ),
            adjacentDays: contextDays.filter(
              (day) =>
                day.date === contextStartDate || day.date === contextEndDate,
            ),
          };
        }),
      );
  }

  private getWorkLogUsers(): Observable<IUser[]> {
    return this.backend.getAll<IUser>({
      table: 'users',
      sortBy: 'createdAt',
      sortOrder: 'asc',
      pagination: {
        filters: {
          appRole: {
            operator: FilterOperator.IN,
            value: getRolesAtOrAbove('gm'),
          },
        },
      },
    });
  }

  private getMonthForUsers(
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

  getOverview(
    monthOffset: WorkLogMonthOffset,
  ): Observable<IWorkLogOverviewData> {
    return this.getWorkLogUsers().pipe(
      switchMap((users) => {
        if (!users.length) {
          return of<IWorkLogOverviewData>({
            users,
            records: [],
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
            return of<IUserWorkLogDay[]>([]);
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
