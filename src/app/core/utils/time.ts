import { ISelectOption } from '../interfaces/i-select-option';
import {
  HOUR_IN_MS,
  HourOffsetValue,
} from '../types/hour-offset';

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
