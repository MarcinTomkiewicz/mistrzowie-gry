import { FormArray, FormControl, FormGroup } from '@angular/forms';

import {
  GmAvailabilityRangeFormGroup,
  IGmAvailabilityCalendarDay,
  IGmAvailabilityDay,
  IGmAvailabilityRange,
  IGmAvailabilitySlotRecord,
} from '../../interfaces/i-gm-availability';
import {
  GmAvailabilityHourValue,
  GmAvailabilityMutationError,
} from '../../types/gm-availability';
import { HourOffsetValue } from '../../types/hour-offset';
import { toIsoDate, toLocalDateTime } from '../date';
import {
  createDefaultHourOffsetRange,
  getHourOffsetFromDateTime,
  hasOverlappingIntervals,
} from '../time';

export function createGmAvailabilityRangeFormGroup(
  range: IGmAvailabilityRange,
): GmAvailabilityRangeFormGroup {
  return new FormGroup({
    id: new FormControl(range.id, { nonNullable: true }),
    startOffset: new FormControl(range.startOffset, { nonNullable: true }),
    endOffset: new FormControl(range.endOffset, { nonNullable: true }),
  });
}

export function replaceGmAvailabilityRangeFormGroups(
  formArray: FormArray<GmAvailabilityRangeFormGroup>,
  ranges: readonly IGmAvailabilityRange[],
): GmAvailabilityRangeFormGroup[] {
  formArray.clear();

  for (const range of ranges) {
    formArray.push(createGmAvailabilityRangeFormGroup(range));
  }

  return [...formArray.controls];
}

export function mapGmAvailabilityRangeFormGroupsToRanges(
  rangeGroups: readonly GmAvailabilityRangeFormGroup[],
): IGmAvailabilityRange[] {
  return [...rangeGroups]
    .map((rangeGroup) => ({
      id: rangeGroup.controls.id.getRawValue(),
      startOffset: Number(rangeGroup.controls.startOffset.getRawValue()),
      endOffset: Number(rangeGroup.controls.endOffset.getRawValue()),
    }))
    .sort((left, right) => left.startOffset - right.startOffset);
}

export function createGmAvailabilityEditorRanges(
  ranges: readonly IGmAvailabilityRange[],
): IGmAvailabilityRange[] {
  if (ranges.length) {
    return [...ranges];
  }

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

  if (!candidate) {
    return null;
  }

  return {
    id: createGmAvailabilityTempId(),
    startOffset: candidate.startOffset,
    endOffset: candidate.endOffset,
  };
}

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
    .map(([date, hours]) => ({
      date,
      hours,
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function hasOverlappingGmAvailabilityDays(
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

  if (hasInvalidDuration) {
    return 'invalid_duration';
  }

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

export function createGmAvailabilityTempId(): string {
  return `draft-${crypto.randomUUID()}`;
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
