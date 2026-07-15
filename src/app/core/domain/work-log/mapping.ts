import {
  IUserWorkLogDay,
  IUserWorkLogRangeRecord,
  IUserWorkLogRecord,
} from '../../interfaces/i-work-log';
import { parseIsoDate } from '../../utils/date';
import { getHourOffsetFromDateTime } from '../../utils/time';

export function mapWorkLogRecordsToDays(
  records: readonly IUserWorkLogRecord[],
): IUserWorkLogDay[] {
  return [...records]
    .map((record) => {
      const baseDate = parseWorkLogDate(record.workDate);
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
    const workLogId = savedDay.id;

    if (!workLogId || !sourceDay) {
      return [];
    }

    return sourceDay.ranges.map((range) => ({
      workLogId,
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
  const baseDate = parseWorkLogDate(dateIso);
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

function parseWorkLogDate(dateIso: string): Date {
  const date = parseIsoDate(dateIso);

  if (!date) {
    throw new Error(`Invalid Work Log date: ${dateIso}`);
  }

  return date;
}
