import { NumericInterval } from '../types/interval';

export function ceilToTimeStep(value: number, stepMs: number): number {
  return Math.ceil(value / stepMs) * stepMs;
}

export function doTimeRangesOverlap(
  left: NumericInterval,
  right: NumericInterval,
): boolean {
  return left.start < right.end && left.end > right.start;
}

export function hasOverlappingIntervals(
  intervals: readonly NumericInterval[],
): boolean {
  const sortedIntervals = [...intervals].sort(
    (left, right) => left.start - right.start,
  );

  for (let index = 1; index < sortedIntervals.length; index += 1) {
    if (sortedIntervals[index].start < sortedIntervals[index - 1].end) {
      return true;
    }
  }

  return false;
}
