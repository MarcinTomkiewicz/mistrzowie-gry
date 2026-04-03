export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getStartOfCurrentMonthIso(baseDate: Date = new Date()): string {
  return toIsoDate(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1));
}

export function getEndOfNextMonthIso(baseDate: Date = new Date()): string {
  return toIsoDate(new Date(baseDate.getFullYear(), baseDate.getMonth() + 2, 0));
}

export function getTodayIso(baseDate: Date = new Date()): string {
  return toIsoDate(baseDate);
}

export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);

  return new Date(year, month, day);
}

export function compareDatesByDay(left: Date, right: Date): number {
  return (
    new Date(left.getFullYear(), left.getMonth(), left.getDate()).getTime() -
    new Date(right.getFullYear(), right.getMonth(), right.getDate()).getTime()
  );
}

export function addDays(date: Date, value: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + value);
}

export function addMonths(date: Date, value: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + value, 1);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function startOfWeek(date: Date, weekStartsOn: number = 1): Date {
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = (localDate.getDay() - weekStartsOn + 7) % 7;

  return addDays(localDate, -diff);
}

export function endOfWeek(date: Date, weekStartsOn: number = 1): Date {
  return addDays(startOfWeek(date, weekStartsOn), 6);
}

export function isSameMonth(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth()
  );
}

export function clampDate(date: Date, minDate: Date, maxDate: Date): Date {
  if (compareDatesByDay(date, minDate) < 0) {
    return minDate;
  }

  if (compareDatesByDay(date, maxDate) > 0) {
    return maxDate;
  }

  return date;
}

export function buildMonthDays(
  monthDate: Date,
  weekStartsOn: number = 1,
): Date[] {
  const start = startOfWeek(startOfMonth(monthDate), weekStartsOn);
  const end = endOfWeek(endOfMonth(monthDate), weekStartsOn);
  const days: Date[] = [];

  for (
    let current = start;
    compareDatesByDay(current, end) <= 0;
    current = addDays(current, 1)
  ) {
    days.push(current);
  }

  return days;
}

export function formatMonthLabel(
  value: Date | string,
  locale: string = 'pl-PL',
): string {
  const date = typeof value === 'string' ? parseIsoDate(value) : value;

  if (!date) {
    return '';
  }

  const formatted = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatDateLabel(
  dateIso: string,
  locale: string = 'pl-PL',
  showWeekDay: boolean = false,
): string {
  const date = new Date(`${dateIso}T12:00:00`);

  const formatted = new Intl.DateTimeFormat(locale, {
    weekday: showWeekDay ? 'long' : undefined,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function getWeekdayLabels(
  locale: string = 'pl-PL',
  weekStartsOn: number = 1,
): string[] {
  const anchor = startOfWeek(new Date(2024, 0, 3), weekStartsOn);

  return Array.from({ length: 7 }, (_, index) => {
    const label = new Intl.DateTimeFormat(locale, {
      weekday: 'short',
    })
      .format(addDays(anchor, index))
      .replace('.', '');

    return label.charAt(0).toUpperCase() + label.slice(1);
  });
}

export function toIsoDates(dates: readonly Date[]): string[] {
  return dates.map((date) => toIsoDate(date));
}
