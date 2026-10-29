export type EventScheduleKind = 'single' | 'recurring' | 'exact_dates';

export type EventScheduleMode = EventScheduleKind | 'range';

export type EventRecurrenceKind =
  | 'WEEKLY'
  | 'MONTHLY_NTH_WEEKDAY'
  | 'MONTHLY_DAY_OF_MONTH';

export type EventMonthlyNth = 1 | 2 | 3 | 4 | 5 | -1;

export type EventMonthlyWeekdayRule = {
  monthlyNth: EventMonthlyNth;
  monthlyWeekday: number;
};
