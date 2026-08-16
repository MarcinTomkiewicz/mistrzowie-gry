import {
  HourOffsetMutationError,
  HourOffsetRangeValue,
} from './hour-offset';

export type WorkLogMonthOffset = 0 | -1;

export type WorkLogRangeDraft = HourOffsetRangeValue;

export enum WorkLogHourValue {
  MinDurationHours = 1,
}

export type WorkLogMutationError = HourOffsetMutationError;
