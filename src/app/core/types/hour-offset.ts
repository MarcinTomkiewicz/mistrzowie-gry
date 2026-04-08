export const HOUR_IN_MS = 60 * 60 * 1000;

export enum HourOffsetValue {
  DayTotalHours = 24,
  DefaultDayStartOffset = 12,
}

export type HourOffsetMutationError =
  | 'invalid_duration'
  | 'overlap'
  | 'no_space';
