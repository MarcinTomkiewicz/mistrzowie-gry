import {
  IGmAvailabilityDay,
  IGmAvailabilityRange,
} from '../../interfaces/i-gm-availability';
import {
  GmAvailabilityHourValue,
  GmAvailabilityMutationError,
} from '../../types/gm-availability';
import { HourOffsetValue } from '../../types/hour-offset';
import {
  createDefaultHourOffsetRange,
  getHourOffsetMutationError,
} from '../../utils/hour-offset';

export function createDefaultGmAvailabilityRange(
  ranges: readonly IGmAvailabilityRange[],
): IGmAvailabilityRange | null {
  return createDefaultHourOffsetRange(ranges, {
    defaultStartOffset: HourOffsetValue.DefaultDayStartOffset,
    minDuration: GmAvailabilityHourValue.MinDurationHours,
    totalHours: HourOffsetValue.DayTotalHours,
  });
}

export function getGmAvailabilityMutationError(
  days: readonly IGmAvailabilityDay[],
  date: string,
  ranges: readonly IGmAvailabilityRange[],
): GmAvailabilityMutationError | null {
  return getHourOffsetMutationError(
    upsertGmAvailabilityDay(days, date, ranges),
    GmAvailabilityHourValue.MinDurationHours,
    HourOffsetValue.DayTotalHours,
  );
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
