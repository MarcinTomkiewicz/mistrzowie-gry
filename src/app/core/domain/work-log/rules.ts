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
  addMonths,
  endOfMonth,
  formatMonthLabel,
  parseIsoDate,
  startOfMonth,
  toIsoDate,
} from '../../utils/date';
import {
  createDefaultHourOffsetRange,
  getHourOffsetDuration,
} from '../../utils/hour-offset';
import { hasOverlappingIntervals } from '../../utils/intervals';

export function getWorkLogMonthScope(
  monthOffset: WorkLogMonthOffset,
  baseDate: Date = new Date(),
): IUserWorkLogMonthScope {
  const monthStart = startOfMonth(addMonths(baseDate, monthOffset));
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
    isEditable: canEditWorkLogMonth(monthOffset, baseDate),
  };
}

export function isChaoticThursdayDate(dateIso: string): boolean {
  return (parseIsoDate(dateIso)?.getDay() ?? -1) === 4;
}

export function createDefaultWorkLogRange(
  ranges: readonly WorkLogRangeDraft[],
): WorkLogRangeDraft | null {
  const candidate = createDefaultHourOffsetRange(ranges, {
    defaultStartOffset: HourOffsetValue.DefaultDayStartOffset,
    minDuration: WorkLogHourValue.MinDurationHours,
    totalHours: HourOffsetValue.DayTotalHours,
  });

  if (!candidate) {
    return null;
  }

  return {
    id: createWorkLogTempId(),
    startOffset: candidate.startOffset,
    endOffset: candidate.endOffset,
  };
}

export function getWorkLogMutationError(
  ranges: readonly WorkLogRangeDraft[],
): WorkLogMutationError | null {
  if (
    ranges.some(
      (range) =>
        getHourOffsetDuration(range.startOffset, range.endOffset) <
        WorkLogHourValue.MinDurationHours,
    )
  ) {
    return 'invalid_duration';
  }

  if (
    hasOverlappingIntervals(
      ranges.map((range) => ({
        start: range.startOffset,
        end: range.endOffset,
      })),
    )
  ) {
    return 'overlap';
  }

  return null;
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

function canEditWorkLogMonth(
  monthOffset: WorkLogMonthOffset,
  baseDate: Date = new Date(),
): boolean {
  return monthOffset === 0 || baseDate.getDate() <= 5;
}

function createWorkLogTempId(): string {
  return `draft-${crypto.randomUUID()}`;
}
