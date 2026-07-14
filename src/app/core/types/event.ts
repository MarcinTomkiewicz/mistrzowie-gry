export type EventScheduleKind = 'single' | 'recurring';

export type EventRecurrenceKind =
  | 'WEEKLY'
  | 'MONTHLY_NTH_WEEKDAY'
  | 'MONTHLY_DAY_OF_MONTH';

export type EventMonthlyNth = 1 | 2 | 3 | 4 | -1;
