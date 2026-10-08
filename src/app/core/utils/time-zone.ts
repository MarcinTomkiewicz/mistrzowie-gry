import { HOUR_IN_MS } from '../types/hour-offset';
import { isValidDate, parseIsoDate } from './date';
import { parseTimeLabelToMinutes } from './time-format';

const DAY_IN_MS = 24 * HOUR_IN_MS;

export function timestampToTimeZoneDate(
  timestamp: string | null | undefined,
  timeZone: string,
): Date | null {
  if (!timestamp) return null;

  const instant = new Date(timestamp);
  if (!isValidDate(instant)) return instant;

  const wallTime = new Date(getTimeZoneWallTime(instant.getTime(), timeZone));
  return new Date(
    wallTime.getUTCFullYear(),
    wallTime.getUTCMonth(),
    wallTime.getUTCDate(),
    wallTime.getUTCHours(),
    wallTime.getUTCMinutes(),
    wallTime.getUTCSeconds(),
    wallTime.getUTCMilliseconds(),
  );
}

export function timeZoneDateToTimestamp(
  date: Date | null | undefined,
  timeZone: string,
  preferredTimestamp?: string | null,
): string | null {
  if (!isValidDate(date)) return null;

  const wallTime = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
  const offsets = new Set(
    [-DAY_IN_MS, 0, DAY_IN_MS].map((offset) => {
      const timestamp = wallTime + offset;
      return getTimeZoneWallTime(timestamp, timeZone) - timestamp;
    }),
  );
  const candidates = [...offsets]
    .map((offset) => wallTime - offset)
    .filter(
      (timestamp) => getTimeZoneWallTime(timestamp, timeZone) === wallTime,
    )
    .sort((left, right) => left - right);
  const preferredTime = preferredTimestamp
    ? new Date(preferredTimestamp).getTime()
    : Number.NaN;
  const timestamp = candidates.includes(preferredTime)
    ? preferredTime
    : candidates[0];

  return timestamp === undefined ? null : new Date(timestamp).toISOString();
}

export function createLocalDateTimeRangeIso(
  dateIso: string,
  startTime: string,
  durationHours: number,
): { startsAt: string; endsAt: string } {
  const startMinutes = parseTimeLabelToMinutes(startTime);
  if (startMinutes === null) throw new Error(`Invalid start time: ${startTime}`);

  const date = parseIsoDate(dateIso);
  if (!date) throw new Error(`Invalid date: ${dateIso}`);

  const hours = Math.floor(startMinutes / 60);
  const minutes = startMinutes % 60;
  const startsAt = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
  );
  const endsAt = new Date(startsAt.getTime() + durationHours * HOUR_IN_MS);

  return {
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  };
}

export function getTimeZoneWallTime(timestamp: number, timeZone: string): number {
  const instant = new Date(timestamp);
  const parts = new Map<string, number>(
    new Intl.DateTimeFormat('en-CA-u-ca-gregory-nu-latn', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(instant)
      .map((part) => [part.type, Number(part.value)] as const),
  );
  const value = (type: string): number => Number(parts.get(type));

  return Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    value('hour'),
    value('minute'),
    value('second'),
    instant.getUTCMilliseconds(),
  );
}
