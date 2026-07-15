import {
  IGmAvailabilityCalendarDay,
  IGmAvailabilityDay,
  IGmAvailabilityRange,
  IGmAvailabilitySlotRecord,
} from '../../interfaces/i-gm-availability';
import { HourOffsetValue } from '../../types/hour-offset';
import { toIsoDate, toLocalDateTime } from '../../utils/date';
import { getHourOffsetFromDateTime } from '../../utils/time';

export function mapGmAvailabilityRecordsToDays(
  records: readonly IGmAvailabilitySlotRecord[],
): IGmAvailabilityDay[] {
  const byDate = new Map<string, IGmAvailabilityRange[]>();

  for (const record of records) {
    const startDate = new Date(record.startsAt);
    const endDate = new Date(record.endsAt);
    const baseDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
    );
    const date = toIsoDate(baseDate);
    const startOffset = Math.round(
      getHourOffsetFromDateTime(baseDate.getTime(), startDate),
    );
    const endOffset = Math.round(
      getHourOffsetFromDateTime(baseDate.getTime(), endDate),
    );
    const ranges = byDate.get(date) ?? [];

    ranges.push({
      id: record.id ?? `${record.startsAt}-${record.endsAt}`,
      startOffset,
      endOffset,
    });
    byDate.set(date, ranges);
  }

  return Array.from(byDate.entries())
    .map(([date, ranges]) => ({
      date,
      ranges: [...ranges].sort(
        (left, right) => left.startOffset - right.startOffset,
      ),
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function mapGmAvailabilityRecordsToCoveredDays(
  records: readonly IGmAvailabilitySlotRecord[],
): IGmAvailabilityDay[] {
  const byDate = new Map<string, IGmAvailabilityRange[]>();

  for (const record of records) {
    const startDate = new Date(record.startsAt);
    const endDate = new Date(record.endsAt);
    let segmentStart = new Date(startDate);

    while (segmentStart.getTime() < endDate.getTime()) {
      const baseDate = new Date(
        segmentStart.getFullYear(),
        segmentStart.getMonth(),
        segmentStart.getDate(),
      );
      const nextDayStart = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate() + 1,
      );
      const segmentEnd = new Date(
        Math.min(endDate.getTime(), nextDayStart.getTime()),
      );
      const date = toIsoDate(baseDate);
      const ranges = byDate.get(date) ?? [];
      const startOffset = Math.round(
        getHourOffsetFromDateTime(baseDate.getTime(), segmentStart),
      );
      const endOffset = Math.round(
        getHourOffsetFromDateTime(baseDate.getTime(), segmentEnd),
      );

      if (endOffset > startOffset) {
        ranges.push({
          id: `${record.id ?? record.gmProfileId}-${date}-${startOffset}-${endOffset}`,
          startOffset,
          endOffset,
        });
        byDate.set(date, ranges);
      }

      segmentStart = segmentEnd;
    }
  }

  return Array.from(byDate.entries())
    .map(([date, ranges]) => ({
      date,
      ranges: mergeGmAvailabilityRanges(ranges),
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function mapGmAvailabilityDaysToRecords(
  days: readonly IGmAvailabilityDay[],
  gmProfileId: string,
): IGmAvailabilitySlotRecord[] {
  return days.flatMap((day) =>
    day.ranges.map((range) => ({
      id: range.id.startsWith('draft-') ? undefined : range.id,
      gmProfileId,
      startsAt: toLocalDateTime(day.date, range.startOffset).toISOString(),
      endsAt: toLocalDateTime(day.date, range.endOffset).toISOString(),
    })),
  );
}

export function mapGmAvailabilityDaysToCalendarDays(
  days: readonly IGmAvailabilityDay[],
): IGmAvailabilityCalendarDay[] {
  const availabilityMap = new Map<string, boolean[]>();

  for (const day of days) {
    for (const range of day.ranges) {
      for (
        let hourOffset = range.startOffset;
        hourOffset < range.endOffset;
        hourOffset += 1
      ) {
        const sourceDate = toLocalDateTime(day.date, hourOffset);
        const date = toIsoDate(sourceDate);
        const hour = sourceDate.getHours();
        const hours =
          availabilityMap.get(date) ??
          Array.from({ length: HourOffsetValue.DayTotalHours }, () => false);

        hours[hour] = true;
        availabilityMap.set(date, hours);
      }
    }
  }

  return Array.from(availabilityMap.entries())
    .map(([date, hours]) => ({ date, hours }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

function mergeGmAvailabilityRanges(
  ranges: readonly IGmAvailabilityRange[],
): IGmAvailabilityRange[] {
  const sortedRanges = [...ranges].sort(
    (left, right) => left.startOffset - right.startOffset,
  );
  const mergedRanges: IGmAvailabilityRange[] = [];

  for (const range of sortedRanges) {
    const previousRange = mergedRanges[mergedRanges.length - 1];

    if (previousRange && range.startOffset <= previousRange.endOffset) {
      previousRange.endOffset = Math.max(
        previousRange.endOffset,
        range.endOffset,
      );
      continue;
    }

    mergedRanges.push({
      id: range.id,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
    });
  }

  return mergedRanges;
}
