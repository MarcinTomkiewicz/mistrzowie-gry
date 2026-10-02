import { doTimeRangesOverlap } from '../../utils/intervals';
import { addDays, compareDatesByDay, isValidDate } from '../../utils/date';
import { parseTimeLabelToMinutes } from '../../utils/time-format';

interface StaffingScheduleSlotTimeRange {
  startTime: string;
  endTime: string;
}

export function getNextStaffingDayDate(
  days: readonly { date: Date | null }[],
): Date | null {
  const latestDate = days.reduce<Date | null>((latest, { date }) => {
    if (!isValidDate(date)) {
      return latest;
    }

    return !latest || compareDatesByDay(date, latest) > 0 ? date : latest;
  }, null);

  return latestDate ? addDays(latestDate, 1) : null;
}

export function getStaffingSlotConflicts(
  slots: readonly StaffingScheduleSlotTimeRange[],
): { indexes: ReadonlySet<number>; count: number } {
  const indexes = new Set<number>();
  let count = 0;
  const ranges = slots.map(({ startTime, endTime }) => {
    const start = parseTimeLabelToMinutes(startTime);
    const end = parseTimeLabelToMinutes(endTime);

    return start === null || end === null || end <= start
      ? null
      : { start, end };
  });

  for (let leftIndex = 0; leftIndex < ranges.length; leftIndex += 1) {
    const left = ranges[leftIndex];

    if (!left) {
      continue;
    }

    for (
      let rightIndex = leftIndex + 1;
      rightIndex < ranges.length;
      rightIndex += 1
    ) {
      const right = ranges[rightIndex];

      if (right && doTimeRangesOverlap(left, right)) {
        indexes.add(leftIndex);
        indexes.add(rightIndex);
        count += 1;
      }
    }
  }

  return { indexes, count };
}

export function getStaffingScheduleSummary(
  days: readonly {
    requiredGmCount: number;
    slots: readonly StaffingScheduleSlotTimeRange[];
  }[],
): {
  dayCount: number;
  slotCount: number;
  dailyStaffingPositions: number;
  conflictCount: number;
} {
  return {
    dayCount: days.length,
    slotCount: days.reduce((total, day) => total + day.slots.length, 0),
    dailyStaffingPositions: days.reduce(
      (total, day) => total + day.requiredGmCount,
      0,
    ),
    conflictCount: days.reduce(
      (total, day) => total + getStaffingSlotConflicts(day.slots).count,
      0,
    ),
  };
}
