import type {
  IAdminEventListItem,
  IEventCoreListItem,
} from '../interfaces/i-event-admin';
import { getTodayIso } from './date';

type UpcomingEventEdition = IAdminEventListItem & {
  nextOccurrenceDate: string;
};

export type EventCoreListRow = {
  core: IEventCoreListItem;
  nextEdition: UpcomingEventEdition | null;
  visibleCities: readonly string[];
  remainingCityCount: number;
};

export function buildEventCoreListRows(
  cores: readonly IEventCoreListItem[],
  editions: readonly IAdminEventListItem[],
  fromDate: string = getTodayIso(),
): EventCoreListRow[] {
  const nextEditionByCoreId = new Map<string, UpcomingEventEdition>();
  const citiesByCoreId = new Map<string, Set<string>>();

  for (const edition of editions) {
    let cities = citiesByCoreId.get(edition.eventCoreId);
    if (cities === undefined) {
      cities = new Set<string>();
      citiesByCoreId.set(edition.eventCoreId, cities);
    }
    cities.add(edition.city);

    const date = edition.nextOccurrenceDate;
    if (date === null || date < fromDate) continue;

    const candidate = { ...edition, nextOccurrenceDate: date };
    const current = nextEditionByCoreId.get(edition.eventCoreId);
    if (current === undefined || compareUpcomingEditions(candidate, current) < 0) {
      nextEditionByCoreId.set(edition.eventCoreId, candidate);
    }
  }

  return cores
    .map((core) => {
      const nextEdition = nextEditionByCoreId.get(core.id) ?? null;
      const cities = [...(citiesByCoreId.get(core.id) ?? [])].sort((left, right) => {
        if (left !== right) {
          if (left === nextEdition?.city) return -1;
          if (right === nextEdition?.city) return 1;
        }
        return left.localeCompare(right, 'pl');
      });
      const visibleCities = cities.slice(0, 2);

      return {
        core,
        nextEdition,
        visibleCities,
        remainingCityCount: cities.length - visibleCities.length,
      };
    })
    .sort((left, right) => {
      const leftDate = left.nextEdition?.nextOccurrenceDate;
      const rightDate = right.nextEdition?.nextOccurrenceDate;

      if (leftDate !== rightDate) {
        if (leftDate === undefined) return 1;
        if (rightDate === undefined) return -1;
        return leftDate < rightDate ? -1 : 1;
      }

      return left.core.name.localeCompare(right.core.name, 'pl') ||
        left.core.id.localeCompare(right.core.id);
    });
}

function compareUpcomingEditions(
  left: UpcomingEventEdition,
  right: UpcomingEventEdition,
): number {
  return left.nextOccurrenceDate.localeCompare(right.nextOccurrenceDate) ||
    left.startTime.localeCompare(right.startTime) ||
    left.city.localeCompare(right.city, 'pl') ||
    left.id.localeCompare(right.id);
}
