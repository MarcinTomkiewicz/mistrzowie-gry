const EXACT_TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function isValidTime(value: unknown): value is string {
  return typeof value === 'string' && EXACT_TIME_PATTERN.test(value);
}

export function normalizeTimeInput(value: string): string {
  const text = value.trim();
  const match = /^(\d{1,2})(?::(\d{1,2})|(\d{2}))?$/.exec(text);
  if (!match) {
    return text;
  }

  const time = `${match[1].padStart(2, '0')}:${(match[2] ?? match[3] ?? '00').padStart(2, '0')}`;
  return isValidTime(time) ? time : text;
}

export function formatTimeLabel(
  timeValue: string | null | undefined,
  showSeconds: boolean = false,
): string {
  if (!timeValue?.trim()) return '';

  const [hours = '', minutes = '', seconds = ''] = timeValue.trim().split(':');
  if (!hours || !minutes) return timeValue;

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

  if (!start && !end) return '';
  if (!start) return end;
  if (!end) return start;

  return `${start} - ${end}`;
}

export function getTimeRangeBounds(
  ranges: readonly { startTime: string | null; endTime: string | null; startDayOffset?: number; endDayOffset?: number }[],
): { startTime: string; endTime: string; startDayOffset: number; endDayOffset: number } | null {
  const timed = ranges.flatMap(({ startTime, endTime, startDayOffset = 0, endDayOffset = 0 }) => {
    if (startTime === null || endTime === null) return [];
    const start = parseTimeLabelToMinutes(startTime);
    const end = parseTimeLabelToMinutes(endTime);
    if (start === null || end === null) return [];
    const startMinute = startDayOffset * 1440 + start;
    const endMinute = endDayOffset * 1440 + end;
    return endMinute > startMinute ? [{ startTime, endTime, startDayOffset, endDayOffset, startMinute, endMinute }] : [];
  });
  if (!timed.length) return null;
  const first = timed.reduce((first, range) => range.startMinute < first.startMinute ? range : first);
  const last = timed.reduce((last, range) => range.endMinute > last.endMinute ? range : last);
  return { startTime: first.startTime, endTime: last.endTime, startDayOffset: first.startDayOffset, endDayOffset: last.endDayOffset };
}

export function formatDateTimeAsTimeLabel(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

export function parseTimeLabelToMinutes(value: unknown): number | null {
  if (!isValidTime(value)) {
    return null;
  }

  const [hours, minutes] = value.split(':').map(Number);

  return hours * 60 + minutes;
}
