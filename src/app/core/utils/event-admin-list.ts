import type {
  IAdminEventListItem,
  IEventCoreListItem,
} from '../interfaces/i-event-admin';
import { getTodayIso } from './date';

export function sortEventCoresByNextOccurrence(
  cores: readonly IEventCoreListItem[],
  editions: readonly IAdminEventListItem[],
  fromDate: string = getTodayIso(),
): IEventCoreListItem[] {
  const nextDateByCoreId = new Map<string, string>();

  for (const edition of editions) {
    const date = edition.nextOccurrenceDate;
    if (date === null || date < fromDate) continue;

    const currentDate = nextDateByCoreId.get(edition.eventCoreId);
    if (currentDate === undefined || date < currentDate) {
      nextDateByCoreId.set(edition.eventCoreId, date);
    }
  }

  return [...cores].sort((left, right) => {
    const leftDate = nextDateByCoreId.get(left.id);
    const rightDate = nextDateByCoreId.get(right.id);

    if (leftDate !== rightDate) {
      if (leftDate === undefined) return 1;
      if (rightDate === undefined) return -1;
      return leftDate < rightDate ? -1 : 1;
    }

    return left.name.localeCompare(right.name, 'pl') ||
      left.id.localeCompare(right.id);
  });
}
