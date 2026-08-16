export const MINUTE_IN_MS = 60 * 1000;
export const HOUR_IN_MS = 60 * 60 * 1000;

export enum HourOffsetValue {
  DayTotalHours = 24,
  DefaultDayStartOffset = 12,
}

export type HourOffsetRangeValue = {
  startOffset: number;
  endOffset: number;
};

export type HourOffsetDay<
  TRange extends HourOffsetRangeValue = HourOffsetRangeValue,
> = {
  date: string;
  ranges: readonly TRange[];
};

export type HourOffsetMutationError =
  | 'invalid_duration'
  | 'overlap'
  | 'no_space';
