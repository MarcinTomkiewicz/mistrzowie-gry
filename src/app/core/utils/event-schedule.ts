import type { IEventRecurringSchedule, IEventSchedule } from '../interfaces/i-event-schedule';
import type { EventMonthlyWeekdayRule } from '../types/event';
import { addDays, addMonths, endOfMonth, parseIsoDate, startOfMonth, toIsoDate } from './date';

export function getEventDateRangeLength(startDate: string, endDate: string): number | null {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  if (!start || !end || endDate < startDate) return null;
  const day = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return (day(end) - day(start)) / 86400000 + 1;
}

export function expandEventDateRange(startDate: string, endDate: string): string[] {
  const start = parseIsoDate(startDate);
  const count = getEventDateRangeLength(startDate, endDate);
  if (!start || count === null) throw new Error('[EVENT_SCHEDULE] Invalid date range.');
  return Array.from({ length: count }, (_, index) => toIsoDate(addDays(start, index)));
}

export function buildEventScheduleExdates(
  startDate: string,
  endDate: string,
  manualDates: readonly string[],
  rules: readonly EventMonthlyWeekdayRule[],
): string[] {
  const dates = new Set(manualDates);
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  if (rules.length && start && end && startDate <= endDate) {
    for (let month = startOfMonth(start); month <= end; month = addMonths(month, 1)) {
      for (const rule of rules) {
        const anchor = rule.monthlyNth === -1 ? endOfMonth(month) : month;
        const offset = rule.monthlyNth === -1
          ? -((anchor.getDay() - rule.monthlyWeekday + 7) % 7)
          : (rule.monthlyWeekday - anchor.getDay() + 7) % 7 + (rule.monthlyNth - 1) * 7;
        const candidate = toIsoDate(addDays(anchor, offset));
        if (candidate >= startDate && candidate <= endDate) dates.add(candidate);
      }
    }
  }
  return [...dates].sort();
}

export function excludesEveryEventRecurrenceCandidate(schedule: IEventRecurringSchedule): boolean {
  const excluded = new Set(schedule.exdates);
  const start = parseIsoDate(schedule.startDate);
  const count = getEventDateRangeLength(schedule.startDate, schedule.endDate);
  if (!start || count === null) throw new Error('[EVENT_SCHEDULE] Invalid recurrence period.');
  const candidates = Array.from({ length: count }, (_, index) => addDays(start, index))
    .filter(date => matchesEventRecurrenceCandidate(schedule, date));
  return candidates.length > 0 && candidates.every(date => excluded.has(toIsoDate(date)));
}

export function matchesEventRecurrenceCandidate(schedule: IEventRecurringSchedule, date: Date): boolean {
  if (schedule.recurrenceKind === 'WEEKLY') {
    // EFS-053 anchors full seven-day windows at startDate, regardless of weekday.
    const days = getEventDateRangeLength(schedule.startDate, toIsoDate(date));
    return days !== null && Math.floor((days - 1) / 7) % schedule.interval === 0
      && schedule.byweekday?.includes(date.getDay()) === true;
  }
  const start = parseIsoDate(schedule.startDate);
  if (!start) return false;
  const monthIndex = (date.getFullYear() - start.getFullYear()) * 12 + date.getMonth() - start.getMonth();
  if (monthIndex < 0 || monthIndex % schedule.interval !== 0) return false;
  switch (schedule.recurrenceKind) {
    case 'MONTHLY_DAY_OF_MONTH': return date.getDate() === schedule.dayOfMonth;
    case 'MONTHLY_NTH_WEEKDAY':
      return date.getDay() === schedule.monthlyWeekday && (schedule.monthlyNth === -1
        ? addDays(date, 7).getMonth() !== date.getMonth()
        : Math.ceil(date.getDate() / 7) === schedule.monthlyNth);
  }
}

export function isEventScheduleDateCandidate(schedule: IEventSchedule, date: string): boolean {
  const parsed = parseIsoDate(date);
  if (!parsed) return false;
  if (schedule.kind === 'single') return date === schedule.date;
  if (schedule.kind === 'exact_dates') return schedule.dates.includes(date);
  if (date < schedule.startDate || date > schedule.endDate || schedule.exdates.includes(date)) return false;
  return matchesEventRecurrenceCandidate(schedule, parsed);
}
