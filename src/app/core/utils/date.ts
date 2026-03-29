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