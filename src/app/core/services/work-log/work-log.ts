import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { WORK_LOG_RPC } from '../../configs/work-log-rpc.config';
import {
  IWorkLogOverviewData,
  IUserWorkLogDay,
  IUserWorkLogMonthData,
} from '../../interfaces/i-work-log';
import { WorkLogMonthOffset } from '../../types/work-log';
import { getWorkLogMonthScope } from '../../domain/work-log/rules';
import { Backend } from '../backend/backend';

@Injectable({ providedIn: 'root' })
export class WorkLog {
  private readonly backend = inject(Backend);

  getMyMonth(
    monthOffset: WorkLogMonthOffset,
  ): Observable<IUserWorkLogMonthData> {
    return this.backend.rpc<IUserWorkLogMonthData>(WORK_LOG_RPC.getMyMonth, {
      p_month_start: getWorkLogMonthScope(monthOffset).startDate,
    });
  }

  getOverview(
    monthOffset: WorkLogMonthOffset,
  ): Observable<IWorkLogOverviewData> {
    return this.backend.rpc<IWorkLogOverviewData>(WORK_LOG_RPC.getOverview, {
      p_month_start: getWorkLogMonthScope(monthOffset).startDate,
    });
  }

  replaceMyMonth(
    days: readonly IUserWorkLogDay[],
    monthOffset: WorkLogMonthOffset,
  ): Observable<IUserWorkLogDay[]> {
    return this.backend.rpc<IUserWorkLogDay[]>(WORK_LOG_RPC.replaceMyMonth, {
      p_month_start: getWorkLogMonthScope(monthOffset).startDate,
      p_days: days,
    });
  }
}
