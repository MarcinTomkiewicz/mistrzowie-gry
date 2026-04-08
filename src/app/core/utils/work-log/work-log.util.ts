import { IGmAvailabilityRange } from '../../interfaces/i-gm-availability';
import {
  IUserWorkLogDay,
  IUserWorkLogMonthScope,
  IUserWorkLogRangeRecord,
  IUserWorkLogRecord,
  IUserWorkLogRowVm,
  WorkLogMonthOffset,
  WorkLogRangeDraft,
} from '../../interfaces/i-work-log';
import {
  addDays,
  addMonths,
  endOfMonth,
  formatDateLabel,
  formatMonthLabel,
  formatWeekdayLabel,
  parseIsoDate,
  startOfMonth,
  toIsoDate,
} from '../date';
import {
  createDefaultHourOffsetRange,
  formatHourOffsetRangeLabel,
  getHourOffsetFromDateTime,
  getHourOffsetDuration,
  hasOverlappingIntervals,
} from '../time';
import {
  WorkLogMutationError,
  WorkLogHourValue,
} from '../../types/work-log';
import { HourOffsetValue } from '../../types/hour-offset';

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

export function canEditWorkLogMonth(
  monthOffset: WorkLogMonthOffset,
  baseDate: Date = new Date(),
): boolean {
  return monthOffset === 0 || baseDate.getDate() <= 5;
}

export function isChaoticThursdayDate(dateIso: string): boolean {
  return (parseIsoDate(dateIso)?.getDay() ?? -1) === 4;
}

export function mapWorkLogRecordsToDays(
  records: readonly IUserWorkLogRecord[],
): IUserWorkLogDay[] {
  return [...records]
    .map((record) => {
      const baseDate = parseIsoDate(record.workDate) ?? new Date();
      const baseTime = baseDate.getTime();

      const ranges = [...(record.userWorkLogRanges ?? [])]
        .map((range) => ({
          id: range.id ?? `${range.startsAt}-${range.endsAt}`,
          startOffset: getHourOffsetFromDateTime(baseTime, range.startsAt),
          endOffset: getHourOffsetFromDateTime(baseTime, range.endsAt),
        }))
        .sort((left, right) => left.startOffset - right.startOffset);

      return {
        id: record.id,
        date: record.workDate,
        ranges,
        isChaoticThursday: !!record.isChaoticThursday,
        comment: record.comment ?? null,
      };
    })
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function mapWorkLogDaysToRecords(
  userId: string,
  days: readonly IUserWorkLogDay[],
): IUserWorkLogRecord[] {
  return days.map((day) => ({
    ...(day.id ? { id: day.id } : {}),
    userId,
    workDate: day.date,
    isChaoticThursday: !!day.isChaoticThursday,
    comment: day.comment ?? null,
  }));
}

export function mapWorkLogDaysToRangeRecords(
  savedDays: readonly IUserWorkLogRecord[],
  sourceDays: readonly IUserWorkLogDay[],
): IUserWorkLogRangeRecord[] {
  return savedDays.flatMap((savedDay) => {
    const sourceDay = sourceDays.find((day) => day.date === savedDay.workDate);

    if (!savedDay.id || !sourceDay) {
      return [];
    }

    return sourceDay.ranges.map((range) => ({
      workLogId: savedDay.id!,
      startsAt: toWorkLogDateTime(savedDay.workDate, range.startOffset),
      endsAt: toWorkLogDateTime(savedDay.workDate, range.endOffset),
    }));
  });
}

export function upsertWorkLogDay(
  days: readonly IUserWorkLogDay[],
  nextDay: IUserWorkLogDay,
): IUserWorkLogDay[] {
  const normalizedDay = normalizeWorkLogDay(nextDay);

  return days
    .filter((day) => day.date !== normalizedDay.date)
    .concat(isMeaningfulWorkLogDay(normalizedDay) ? [normalizedDay] : [])
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function createDefaultWorkLogRange(
  ranges: readonly WorkLogRangeDraft[],
): IGmAvailabilityRange | null {
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

export function formatWorkLogHours(hours: number): string {
  const normalized = Number.isInteger(hours) ? String(hours) : hours.toFixed(2);

  return normalized.replace(/\.00$/, '').replace('.', ',');
}

export function formatWorkLogRangesLabel(
  ranges: readonly Pick<IGmAvailabilityRange, 'startOffset' | 'endOffset'>[],
): string {
  return ranges
    .map((range) =>
      formatHourOffsetRangeLabel(range.startOffset, range.endOffset),
    )
    .join(', ');
}

export function createWorkLogRows(
  monthScope: IUserWorkLogMonthScope,
  days: readonly IUserWorkLogDay[],
): IUserWorkLogRowVm[] {
  const dayMap = new Map(days.map((day) => [day.date, day] as const));

  return monthScope.days.map((date) => {
    const day = dayMap.get(date) ?? null;

    return {
      date,
      dateLabel: formatDateLabel(date, 'pl-PL'),
      weekdayLabel: formatWeekdayLabel(date, 'pl-PL'),
      isChaoticThursdayDay: isChaoticThursdayDate(date),
      day,
      totalHours: getWorkLogDayHours(day),
    };
  });
}

function normalizeWorkLogDay(day: IUserWorkLogDay): IUserWorkLogDay {
  return {
    ...day,
    ranges: [...day.ranges].sort(
      (left, right) => left.startOffset - right.startOffset,
    ),
    comment: day.comment?.trim() || null,
  };
}

function isMeaningfulWorkLogDay(day: IUserWorkLogDay): boolean {
  return !!day.ranges.length || !!day.isChaoticThursday || !!day.comment?.trim();
}

function toWorkLogDateTime(dateIso: string, hourOffset: number): string {
  const baseDate = parseIsoDate(dateIso) ?? new Date();
  const wholeHours = Math.trunc(hourOffset);
  const minutes = Math.round((hourOffset - wholeHours) * 60);

  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    wholeHours,
    minutes,
  ).toISOString();
}

function createWorkLogTempId(): string {
  return `draft-${crypto.randomUUID()}`;
}
