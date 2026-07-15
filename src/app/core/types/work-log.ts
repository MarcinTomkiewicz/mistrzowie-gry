import { HourOffsetMutationError, HourOffsetRange } from './hour-offset';

export type WorkLogMonthOffset = 0 | -1;

export type WorkLogRangeDraft = HourOffsetRange;

export enum WorkLogHourValue {
  MinDurationHours = 1,
}

export type WorkLogMutationError = HourOffsetMutationError;
