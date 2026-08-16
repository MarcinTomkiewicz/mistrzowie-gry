import { ISelectOption } from '../interfaces/i-select-option';
import {
  HOUR_IN_MS,
  HourOffsetDay,
  HourOffsetMutationError,
  HourOffsetRangeValue,
  HourOffsetValue,
} from '../types/hour-offset';
import { toLocalDateTime } from './date';
import { hasOverlappingIntervals } from './intervals';

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
    return { value, label: formatHourOffsetLabel(value, totalHours) };
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

export function clampEndHourOffset(
  startOffset: number,
  endOffset: number,
  minDuration: number,
): number {
  return Math.min(
    Math.max(endOffset, startOffset + minDuration),
    startOffset + HourOffsetValue.DayTotalHours,
  );
}

export function getHourOffsetDuration(
  startOffset: number,
  endOffset: number,
): number {
  return Math.max(endOffset - startOffset, 0);
}

export function createDefaultHourOffsetRange(
  ranges: readonly HourOffsetRangeValue[],
  opts: {
    defaultStartOffset?: number;
    minDuration?: number;
    totalHours?: number;
  } = {},
): HourOffsetRangeValue | null {
  const defaultStartOffset =
    opts.defaultStartOffset ?? HourOffsetValue.DefaultDayStartOffset;
  const minDuration = opts.minDuration ?? 1;
  const totalHours = opts.totalHours ?? HourOffsetValue.DayTotalHours;

  for (
    let hour = defaultStartOffset;
    hour < totalHours;
    hour += 1
  ) {
    const candidate = {
      startOffset: hour,
      endOffset: hour + minDuration,
    };
    if (!hasHourOffsetOverlap(ranges, candidate)) return candidate;
  }

  for (let hour = 0; hour < defaultStartOffset; hour += 1) {
    const candidate = {
      startOffset: hour,
      endOffset: hour + minDuration,
    };
    if (!hasHourOffsetOverlap(ranges, candidate)) return candidate;
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

export function getHourOffsetMutationError(
  days: readonly HourOffsetDay<HourOffsetRangeValue>[],
  minDuration: number,
  maxDuration: number,
): HourOffsetMutationError | null {
  if (
    days.some((day) =>
      day.ranges.some(
        (range) => {
          const duration = getHourOffsetDuration(
            range.startOffset,
            range.endOffset,
          );

          return duration < minDuration || duration > maxDuration;
        },
      ),
    )
  ) {
    return 'invalid_duration';
  }

  if (
    hasOverlappingIntervals(
      days.flatMap((day) =>
        day.ranges.map((range) => ({
          start: toLocalDateTime(day.date, range.startOffset).getTime(),
          end: toLocalDateTime(day.date, range.endOffset).getTime(),
        })),
      ),
    )
  ) {
    return 'overlap';
  }

  return null;
}

function hasHourOffsetOverlap(
  ranges: readonly HourOffsetRangeValue[],
  candidate: HourOffsetRangeValue,
): boolean {
  return hasOverlappingIntervals(
    [...ranges, candidate].map((range) => ({
      start: range.startOffset,
      end: range.endOffset,
    })),
  );
}
