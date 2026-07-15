import {
  IGmAvailabilityDay,
  IGmAvailabilityRange,
} from '../../interfaces/i-gm-availability';
import {
  GmAvailabilityHourValue,
  GmAvailabilityMutationError,
} from '../../types/gm-availability';
import { HourOffsetValue } from '../../types/hour-offset';
import { toLocalDateTime } from '../../utils/date';
import {
  createDefaultHourOffsetRange,
  hasOverlappingIntervals,
} from '../../utils/time';

export function createGmAvailabilityEditorRanges(
  ranges: readonly IGmAvailabilityRange[],
): IGmAvailabilityRange[] {
  if (ranges.length) return [...ranges];

  const range = createDefaultGmAvailabilityRange([]);
  return range ? [range] : [];
}

export function createDefaultGmAvailabilityRange(
  ranges: readonly IGmAvailabilityRange[],
): IGmAvailabilityRange | null {
  const candidate = createDefaultHourOffsetRange(ranges, {
    defaultStartOffset: HourOffsetValue.DefaultDayStartOffset,
    minDuration: GmAvailabilityHourValue.MinDurationHours,
    totalHours: HourOffsetValue.DayTotalHours,
  });

  if (!candidate) return null;

  return {
    id: createGmAvailabilityTempId(),
    startOffset: candidate.startOffset,
    endOffset: candidate.endOffset,
  };
}

function hasOverlappingGmAvailabilityDays(
  days: readonly IGmAvailabilityDay[],
): boolean {
  return hasOverlappingIntervals(
    days.flatMap((day) =>
      day.ranges.map((range) => ({
        start: toLocalDateTime(day.date, range.startOffset).getTime(),
        end: toLocalDateTime(day.date, range.endOffset).getTime(),
      })),
    ),
  );
}

export function getGmAvailabilityMutationError(
  days: readonly IGmAvailabilityDay[],
  date: string,
  ranges: readonly IGmAvailabilityRange[],
): GmAvailabilityMutationError | null {
  const hasInvalidDuration = ranges.some(
    (range) =>
      range.endOffset - range.startOffset <
      GmAvailabilityHourValue.MinDurationHours,
  );

  if (hasInvalidDuration) return 'invalid_duration';

  if (
    hasOverlappingGmAvailabilityDays(upsertGmAvailabilityDay(days, date, ranges))
  ) {
    return 'overlap';
  }

  return null;
}

export function upsertGmAvailabilityDay(
  days: readonly IGmAvailabilityDay[],
  date: string,
  ranges: readonly IGmAvailabilityRange[],
): IGmAvailabilityDay[] {
  return days
    .filter((day) => day.date !== date)
    .concat(
      ranges.length
        ? [
            {
              date,
              ranges: [...ranges].sort(
                (left, right) => left.startOffset - right.startOffset,
              ),
            },
          ]
        : [],
    )
    .sort((left, right) => left.date.localeCompare(right.date));
}

function createGmAvailabilityTempId(): string {
  return `draft-${crypto.randomUUID()}`;
}
