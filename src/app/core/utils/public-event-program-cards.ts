import type { IEventSlotCardVm } from '../interfaces/i-event-slot-card';
import type { ISystem } from '../interfaces/i-system';
import type { IPublicStorageUrlResolver } from '../interfaces/i-storage';
import type { EventPageProgramTranslations } from '../types/i18n/event-page';
import type { PublicEventProgramEntry } from '../types/public-event-program';
import { resolvePublicStorageUrl } from './storage-url';
import { normalizeText } from './normalize-text';
import { formatTimeRangeLabel } from './time-format';

type PublicEventProgramGroup = Pick<PublicEventProgramEntry['slot'], 'startTime' | 'endTime'> & {
  key: string;
  entries: PublicEventProgramEntry[];
};

export function groupPublicEventProgramEntries(
  entries: readonly PublicEventProgramEntry[],
): PublicEventProgramGroup[] {
  const groups = new Map<string, PublicEventProgramGroup>();
  for (const entry of entries) {
    const { startTime, endTime } = entry.slot;
    const key = `${entry.occurrenceId}:${startTime ?? ''}:${endTime ?? ''}`;
    const group = groups.get(key);
    if (group) {
      group.entries.push(entry);
    } else {
      groups.set(key, { key, startTime, endTime, entries: [entry] });
    }
  }

  return [...groups.values()].sort((left, right) => {
    if (left.startTime === null) return right.startTime === null ? 0 : 1;
    if (right.startTime === null) return -1;
    return left.startTime.localeCompare(right.startTime) ||
      (left.endTime ?? '').localeCompare(right.endTime ?? '');
  });
}

export function createPublicEventProgramCards(
  entries: readonly PublicEventProgramEntry[],
  systems: readonly ISystem[],
  storage: IPublicStorageUrlResolver,
  copy: EventPageProgramTranslations,
  missingTitle: string,
  gmLabel: string,
  eventName: string,
): IEventSlotCardVm[] {
  const eventLabel = normalizeText(eventName)?.toLocaleLowerCase('pl-PL');
  return entries.map((entry) => {
    const pending = entry.kind === 'pending';
    const session = entry.session;
    const slotLabel = normalizeText(entry.slot.label);
    const title = pending ? copy.pending : normalizeText(session?.title) || missingTitle;
    const system = entry.kind === 'confirmed'
      ? entry.session.system
      : systems.find((system) => system.id === session?.systemId) ?? null;
    return {
      id: entry.programItemId,
      gmProfileId: entry.host?.userId ?? null,
      title,
      imageUrl: resolvePublicStorageUrl(storage, session?.image),
      gmDisplayName: entry.host ? entry.host.displayName || gmLabel : null,
      system,
      ...(entry.kind === 'confirmed' ? {
        styles: entry.session.styles,
        triggers: entry.session.triggers,
        languages: entry.session.languages,
      } : {}),
      difficultyLevel: session?.difficultyLevel ?? null,
      minAge: session?.minAge ?? null,
      description: pending ? copy.inPreparation : null,
      isEmpty: pending,
      canOpenDetails: !pending,
      canOpenGmProfile: !pending,
      programStatus: pending ? 'pending' : 'confirmed',
      occurrenceDate: entry.occurrenceDate,
      slotLabel: slotLabel?.toLocaleLowerCase('pl-PL') === eventLabel ? null : slotLabel,
      timeLabel: formatTimeRangeLabel(entry.slot.startTime, entry.slot.endTime),
      sessionDetails: session ? { ...session, title, ...(system ? { system } : {}) } : null,
    };
  });
}
