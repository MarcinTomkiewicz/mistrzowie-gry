import { ISelectOption } from '../interfaces/i-select-option';
import {
  HOUR_IN_MS,
  HourOffsetValue,
} from '../types/hour-offset';

const DAY_IN_MS = 24 * HOUR_IN_MS;

export function formatTimeLabel(
  timeValue: string | null | undefined,
  showSeconds: boolean = false,
): string {
  if (!timeValue?.trim()) {
    return '';
  }

  const [hours = '', minutes = '', seconds = ''] = timeValue.trim().split(':');

  if (!hours || !minutes) {
    return timeValue;
  }

  return showSeconds
    ? `${hours}:${minutes}:${seconds || '00'}`
    : `${hours}:${minutes}`;
}

export function formatTimeRangeLabel(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
  showSeconds: boolean = false,
): string {
  const start = formatTimeLabel(startTime, showSeconds);
  const end = formatTimeLabel(endTime, showSeconds);

  if (!start && !end) {
    return '';
  }

  if (!start) {
    return end;
  }

  if (!end) {
    return start;
  }

  return `${start} - ${end}`;
}

export function formatHourOffsetLabel(
  offset: number,
  totalHours: number = HourOffsetValue.DayTotalHours,
): string {
  const normalizedHour = ((offset % totalHours) + totalHours) % totalHours;
  const dayOffset = Math.floor(offset / totalHours);
  const label = `${String(normalizedHour).padStart(2, '0')}:00`;

  return dayOffset > 0 ? `${label} (+${dayOffset})` : label;
}

export function formatHourOffsetRangeLabel(
  startOffset: number,
  endOffset: number,
  totalHours: number = HourOffsetValue.DayTotalHours,
): string {
  return `${formatHourOffsetLabel(
    startOffset,
    totalHours,
  )} - ${formatHourOffsetLabel(endOffset, totalHours)}`;
}

export function formatDateTimeAsTimeLabel(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

export function timestampToTimeZoneDate(
  timestamp: string | null | undefined,
  timeZone: string,
): Date | null {
  if (!timestamp) {
    return null;
  }

  const instant = new Date(timestamp);

  if (Number.isNaN(instant.getTime())) {
    return instant;
  }

  const wallTime = new Date(
    getTimeZoneWallTime(instant.getTime(), timeZone),
  );

  return new Date(
    wallTime.getUTCFullYear(),
    wallTime.getUTCMonth(),
    wallTime.getUTCDate(),
    wallTime.getUTCHours(),
    wallTime.getUTCMinutes(),
    wallTime.getUTCSeconds(),
    wallTime.getUTCMilliseconds(),
  );
}

export function timeZoneDateToTimestamp(
  date: Date | null | undefined,
  timeZone: string,
  preferredTimestamp?: string | null,
): string | null {
  if (!date || Number.isNaN(date.getTime())) {
    return null;
  }

  const wallTime = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
  const offsets = new Set(
    [-DAY_IN_MS, 0, DAY_IN_MS].map((offset) => {
      const timestamp = wallTime + offset;

      return getTimeZoneWallTime(timestamp, timeZone) - timestamp;
    }),
  );
  const candidates = [...offsets]
    .map((offset) => wallTime - offset)
    .filter(
      (timestamp) =>
        getTimeZoneWallTime(timestamp, timeZone) === wallTime,
    )
    .sort((left, right) => left - right);
  const preferredTime = preferredTimestamp
    ? new Date(preferredTimestamp).getTime()
    : Number.NaN;
  const timestamp = candidates.includes(preferredTime)
    ? preferredTime
    : candidates[0];

  return timestamp === undefined
    ? null
    : new Date(timestamp).toISOString();
}

export function createHourOffsetOptions(
  start: number,
  end: number,
  totalHours: number = HourOffsetValue.DayTotalHours,
): ISelectOption<number>[] {
  return Array.from({ length: Math.max(end - start, 0) }, (_, index) => {
    const value = start + index;

    return {
      value,
      label: formatHourOffsetLabel(value, totalHours),
    };
  });
}

export function createEndHourOffsetOptions(
  startOffset: number,
  minDuration: number,
  totalHours: number = HourOffsetValue.DayTotalHours,
): ISelectOption<number>[] {
  return createHourOffsetOptions(
    startOffset + minDuration,
    startOffset + totalHours + 1,
    totalHours,
  );
}

export function normalizeEndHourOffset(
  startOffset: number,
  minDuration: number,
): number {
  return startOffset + minDuration;
}

export function getHourOffsetDuration(
  startOffset: number,
  endOffset: number,
): number {
  return Math.max(endOffset - startOffset, 0);
}

export function createDefaultHourOffsetRange(
  ranges: readonly { startOffset: number; endOffset: number }[],
  opts: {
    defaultStartOffset?: number;
    minDuration?: number;
    totalHours?: number;
  } = {},
): { startOffset: number; endOffset: number } | null {
  const defaultStartOffset =
    opts.defaultStartOffset ?? HourOffsetValue.DefaultDayStartOffset;
  const minDuration = opts.minDuration ?? 1;
  const totalHours = opts.totalHours ?? HourOffsetValue.DayTotalHours;

  for (
    let hour = defaultStartOffset;
    hour <= totalHours - minDuration;
    hour += 1
  ) {
    const candidate = {
      startOffset: hour,
      endOffset: hour + minDuration,
    };

    if (!hasHourOffsetOverlap(ranges, candidate)) {
      return candidate;
    }
  }

  for (let hour = 0; hour < defaultStartOffset; hour += 1) {
    const candidate = {
      startOffset: hour,
      endOffset: hour + minDuration,
    };

    if (!hasHourOffsetOverlap(ranges, candidate)) {
      return candidate;
    }
  }

  return null;
}

export function getHourOffsetFromDateTime(
  baseTime: number,
  value: string | Date,
): number {
  const date = typeof value === 'string' ? new Date(value) : value;

  return (date.getTime() - baseTime) / HOUR_IN_MS;
}

export function createLocalDateTimeRangeIso(
  dateIso: string,
  startTime: string,
  durationHours: number,
): { startsAt: string; endsAt: string } {
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(startTime);

  if (!match) {
    throw new Error(`Invalid start time: ${startTime}`);
  }

  const [year, month, day] = dateIso.split('-').map(Number);
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const startsAt = new Date(year, month - 1, day, hours, minutes);
  const endsAt = new Date(startsAt.getTime() + durationHours * HOUR_IN_MS);

  return {
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  };
}

export function ceilToTimeStep(value: number, stepMs: number): number {
  return Math.ceil(value / stepMs) * stepMs;
}

export function doTimeRangesOverlap(
  left: { start: number; end: number },
  right: { start: number; end: number },
): boolean {
  return left.start < right.end && left.end > right.start;
}

export function hasOverlappingIntervals(
  intervals: readonly { start: number; end: number }[],
): boolean {
  const sortedIntervals = [...intervals].sort(
    (left, right) => left.start - right.start,
  );

  for (let index = 1; index < sortedIntervals.length; index += 1) {
    if (sortedIntervals[index].start < sortedIntervals[index - 1].end) {
      return true;
    }
  }

  return false;
}

function hasHourOffsetOverlap(
  ranges: readonly { startOffset: number; endOffset: number }[],
  candidate: { startOffset: number; endOffset: number },
): boolean {
  return hasOverlappingIntervals(
    [...ranges, candidate].map((range) => ({
      start: range.startOffset,
      end: range.endOffset,
    })),
  );
}

function getTimeZoneWallTime(timestamp: number, timeZone: string): number {
  const instant = new Date(timestamp);
  const parts = new Map<string, number>(
    new Intl.DateTimeFormat('en-CA-u-ca-gregory-nu-latn', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(instant)
      .map((part) => [part.type, Number(part.value)] as const),
  );
  const value = (type: string): number => Number(parts.get(type));

  return Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    value('hour'),
    value('minute'),
    value('second'),
    instant.getUTCMilliseconds(),
  );
}
