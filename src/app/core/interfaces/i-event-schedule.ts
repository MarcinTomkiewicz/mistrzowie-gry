import { EventMonthlyNth, EventRecurrenceKind } from '../types/event';

export interface IEventSingleSchedule {
  kind: 'single';
  date: string;
}

export interface IEventExactDatesSchedule {
  kind: 'exact_dates';
  dates: string[];
}

export interface IEventRecurringSchedule {
  kind: 'recurring';
  recurrenceKind: EventRecurrenceKind;
  interval: number;
  byweekday: number[] | null;
  monthlyNth: EventMonthlyNth | null;
  monthlyWeekday: number | null;
  dayOfMonth: number | null;
  startDate: string;
  endDate: string;
  exdates: string[];
}

export type IEventSchedule =
  | IEventSingleSchedule
  | IEventRecurringSchedule
  | IEventExactDatesSchedule;
