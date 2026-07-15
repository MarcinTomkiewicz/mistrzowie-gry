import {
  IUserWorkLogDay,
  IUserWorkLogMonthScope,
  IUserWorkLogRowVm,
} from '../../interfaces/i-work-log';
import { formatDateLabel, formatWeekdayLabel } from '../../utils/date';
import { getWorkLogDayHours, isChaoticThursdayDate } from './rules';

export function formatWorkLogHours(hours: number): string {
  const normalized = Number.isInteger(hours) ? String(hours) : hours.toFixed(2);

  return normalized.replace(/\.00$/, '').replace('.', ',');
}

export function createWorkLogRows(
  monthScope: IUserWorkLogMonthScope,
  days: readonly IUserWorkLogDay[],
): IUserWorkLogRowVm[] {
  const dayMap = new Map(days.map((day) => [day.date, day] as const));

  return monthScope.days.map((date) => {
    const day = dayMap.get(date) ?? null;

    return {
      date,
      dateLabel: formatDateLabel(date, 'pl-PL'),
      weekdayLabel: formatWeekdayLabel(date, 'pl-PL'),
      isChaoticThursdayDay: isChaoticThursdayDate(date),
      day,
      totalHours: getWorkLogDayHours(day),
    };
  });
}
