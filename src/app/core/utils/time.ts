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
