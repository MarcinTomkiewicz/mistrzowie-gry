import { DEFAULT_TIMEZONE } from '../configs/time.config';
import type { ISelectOption } from '../interfaces/i-select-option';
import { HOUR_IN_MS } from '../types/hour-offset';
import { isValidDate, parseIsoDate } from './date';
import { parseTimeLabelToMinutes } from './time-format';

const DAY_IN_MS = 24 * HOUR_IN_MS;

export function createTimeZoneOptions(referenceDate: Date): ISelectOption[] {
  const commonZones = [DEFAULT_TIMEZONE, 'UTC', 'Europe/London', 'America/New_York', 'Asia/Tokyo'];
  return [...new Set([...commonZones, ...Intl.supportedValuesOf('timeZone')])]
    .map((timeZone) => {
      const offset = Math.round((getTimeZoneWallTime(referenceDate.getTime(), timeZone) - referenceDate.getTime()) / 60000);
      const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
      const minutes = String(Math.abs(offset) % 60).padStart(2, '0');
      const zoneName = new Intl.DateTimeFormat('pl-PL', { timeZone, timeZoneName: 'short' })
        .formatToParts(referenceDate)
        .filter((part) => part.type === 'timeZoneName')
        .map((part) => part.value).join('');
      const city = timeZone.replace(/^.*\//, '').replaceAll('_', ' ');

      return { value: timeZone, label: `${zoneName} (UTC${offset < 0 ? '-' : '+'}${hours}:${minutes}) - ${city}`, offset };
    })
    .sort((left, right) => {
      const leftCommon = commonZones.indexOf(left.value);
      const rightCommon = commonZones.indexOf(right.value);
      if (leftCommon >= 0 || rightCommon >= 0) {
        return (leftCommon < 0 ? commonZones.length : leftCommon) - (rightCommon < 0 ? commonZones.length : rightCommon);
      }
      return left.offset - right.offset || left.value.localeCompare(right.value);
    })
    .map(({ value, label }) => ({ value, label }));
}

export function timestampToTimeZoneDate(
  timestamp: string | null | undefined,
  timeZone: string,
): Date | null {
  if (!timestamp) return null;

  const instant = new Date(timestamp);
  if (!isValidDate(instant)) return null;

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
