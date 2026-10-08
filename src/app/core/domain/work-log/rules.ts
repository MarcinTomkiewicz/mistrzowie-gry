import { DEFAULT_TIMEZONE } from '../../configs/time.config';
import {
  IUserWorkLogDay,
  IUserWorkLogMonthScope,
} from '../../interfaces/i-work-log';
import { HourOffsetValue } from '../../types/hour-offset';
import {
  WorkLogHourValue,
  WorkLogMonthOffset,
  WorkLogMutationError,
  WorkLogRangeDraft,
} from '../../types/work-log';
import {
  addDays,
  endOfMonth,
  formatMonthLabel,
  parseIsoDate,
  toIsoDate,
} from '../../utils/date';
import {
  createDefaultHourOffsetRange,
  getHourOffsetDuration,
  getHourOffsetMutationError,
} from '../../utils/hour-offset';
import { getTimeZoneWallTime } from '../../utils/time-zone';

export function getWorkLogMonthScope(
  monthOffset: WorkLogMonthOffset,
  baseDate: Date = new Date(),
): IUserWorkLogMonthScope {
  const warsawDate = new Date(
    getTimeZoneWallTime(baseDate.getTime(), DEFAULT_TIMEZONE),
  );
  const monthStart = new Date(
    warsawDate.getUTCFullYear(),
    warsawDate.getUTCMonth() + monthOffset,
    1,
  );
  const monthEnd = endOfMonth(monthStart);
  const days: string[] = [];

  for (
    let current = monthStart;
    current.getTime() <= monthEnd.getTime();
    current = addDays(current, 1)
  ) {
    days.push(toIsoDate(current));
  }

  return {
    monthOffset,
    startDate: toIsoDate(monthStart),
    endDate: toIsoDate(monthEnd),
    days,
    label: formatMonthLabel(monthStart),
    isEditable: monthOffset === 0 || warsawDate.getUTCDate() <= 5,
  };
}

export function isChaoticThursdayDate(dateIso: string): boolean {
  return (parseIsoDate(dateIso)?.getDay() ?? -1) === 4;
}

export function createDefaultWorkLogRange(
  ranges: readonly WorkLogRangeDraft[],
): WorkLogRangeDraft | null {
  return createDefaultHourOffsetRange(ranges, {
    defaultStartOffset: HourOffsetValue.DefaultDayStartOffset,
    minDuration: WorkLogHourValue.MinDurationHours,
    totalHours: HourOffsetValue.DayTotalHours,
  });
}

export function getWorkLogMutationError(
  days: readonly Pick<IUserWorkLogDay, 'date' | 'ranges'>[],
): WorkLogMutationError | null {
  return getHourOffsetMutationError(
    days,
    WorkLogHourValue.MinDurationHours,
    HourOffsetValue.DayTotalHours,
  );
}

export function getWorkLogDayHours(
  day: Pick<IUserWorkLogDay, 'ranges'> | null | undefined,
): number {
  if (!day) {
    return 0;
  }

  return day.ranges.reduce(
    (total, range) =>
      total + getHourOffsetDuration(range.startOffset, range.endOffset),
    0,
  );
}

export function getWorkLogTotalHours(
  days: readonly Pick<IUserWorkLogDay, 'ranges'>[],
): number {
  return days.reduce((total, day) => total + getWorkLogDayHours(day), 0);
}
