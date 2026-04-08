export function formatTimeLabel(
  timeValue: string | null | undefined,
  showSeconds: boolean = false,
): string {
  if (!timeValue?.trim()) {
    return '';
  }

  const [hours = '', minutes = '', seconds = ''] = timeValue.trim().split(':');

  if (!hours || !minutes) {
    return timeValue;
  }

  return showSeconds
    ? `${hours}:${minutes}:${seconds || '00'}`
    : `${hours}:${minutes}`;
}

export function formatTimeRangeLabel(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
  showSeconds: boolean = false,
): string {
  const start = formatTimeLabel(startTime, showSeconds);
  const end = formatTimeLabel(endTime, showSeconds);

  if (!start && !end) {
    return '';
  }

  if (!start) {
    return end;
  }

  if (!end) {
    return start;
  }

  return `${start} - ${end}`;
}

export function formatHourOffsetLabel(
  offset: number,
  totalHours: number = 24,
): string {
  const normalizedHour = ((offset % totalHours) + totalHours) % totalHours;
  const dayOffset = Math.floor(offset / totalHours);
  const label = `${String(normalizedHour).padStart(2, '0')}:00`;

  return dayOffset > 0 ? `${label} (+${dayOffset})` : label;
}

export function formatHourOffsetRangeLabel(
  startOffset: number,
  endOffset: number,
  totalHours: number = 24,
): string {
  return `${formatHourOffsetLabel(
    startOffset,
    totalHours,
  )} - ${formatHourOffsetLabel(endOffset, totalHours)}`;
}

export function hasOverlappingIntervals(
  intervals: readonly { start: number; end: number }[],
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
