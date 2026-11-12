import type { IEventSlotCardVm } from '../interfaces/i-event-slot-card';
import type { IPublicStorageUrlResolver } from '../interfaces/i-storage';
import type { EventPageProgramTranslations } from '../types/i18n/event-page';
import type { PublicEventProgramEntry } from '../types/public-event-program';
import { resolvePublicStorageUrl } from './storage-url';
import { normalizeText } from './normalize-text';
import { formatTimeRangeLabel } from './time-format';

type PublicEventProgramGroup = Pick<PublicEventProgramEntry['slot'], 'startTime' | 'endTime' | 'startDayOffset' | 'endDayOffset'> & {
  key: string;
  eventScoped: boolean;
  entries: PublicEventProgramEntry[];
};

export function groupPublicEventProgramEntries(
  entries: readonly PublicEventProgramEntry[],
): PublicEventProgramGroup[] {
  const groups = new Map<string, PublicEventProgramGroup>();
  for (const entry of entries) {
    const { startTime, endTime } = entry.slot;
    const eventScoped = entry.kind === 'confirmed' && 'timeScope' in entry && entry.timeScope === 'event';
    const key = `${entry.occurrenceId}:${eventScoped ? 'event' : 'slot'}:${entry.slot.startDayOffset ?? 0}:${startTime ?? ''}:${entry.slot.endDayOffset ?? 0}:${endTime ?? ''}`;
    const group = groups.get(key);
    if (group) {
      group.entries.push(entry);
    } else {
      groups.set(key, { key, eventScoped, startTime, endTime, startDayOffset: entry.slot.startDayOffset, endDayOffset: entry.slot.endDayOffset, entries: [entry] });
    }
  }

  return [...groups.values()].sort((left, right) => {
    if (left.startTime === null) return right.startTime === null ? 0 : 1;
    if (right.startTime === null) return -1;
    return (left.startDayOffset ?? 0) - (right.startDayOffset ?? 0) || left.startTime.localeCompare(right.startTime) ||
      (left.endDayOffset ?? 0) - (right.endDayOffset ?? 0) ||
      (left.endTime ?? '').localeCompare(right.endTime ?? '');
  });
}

export function createPublicEventProgramCards(
  entries: readonly PublicEventProgramEntry[],
  storage: IPublicStorageUrlResolver,
  copy: EventPageProgramTranslations,
  missingTitle: string,
  gmLabel: string,
  eventName: string,
): IEventSlotCardVm[] {
  const eventLabel = normalizeText(eventName)?.toLocaleLowerCase('pl-PL');
  return entries.map((entry) => {
    const pending = entry.kind === 'pending';
    const activity = 'activity' in entry ? entry.activity : null;
    const session = entry.session;
    const slotLabel = normalizeText(entry.slot.label);
    const title = pending ? copy.pending : activity?.title ?? normalizeText(session?.title) ?? missingTitle;
    const system = session?.system ?? null;
    return {
      id: 'activityId' in entry ? entry.activityId : entry.programItemId,
      gmProfileId: entry.host?.userId ?? null,
      title,
      imageUrl: resolvePublicStorageUrl(storage, session?.image),
      gmDisplayName: entry.host ? entry.host.displayName || gmLabel : null,
      system,
      ...(entry.kind === 'confirmed' && entry.session !== null ? {
        styles: entry.session.styles,
        triggers: entry.session.triggers,
        languages: entry.session.languages,
      } : {}),
      difficultyLevel: session?.difficultyLevel ?? null,
      minAge: session?.minAge ?? null,
      description: pending ? copy.inPreparation : null,
      isEmpty: pending,
      canOpenDetails: !pending && !activity,
      canOpenGmProfile: !pending && !activity,
      programStatus: pending ? 'pending' : 'confirmed',
      slotLabel: slotLabel?.toLocaleLowerCase('pl-PL') === eventLabel ? null : slotLabel,
      timeLabel: formatPublicEventProgramTime(entry.slot, copy.dayOffset),
      sessionDetails: session ? { ...session, title, ...(system ? { system } : {}) } : null,
      ...(activity ? { activity } : {}),
    };
  });
}

export function formatPublicEventProgramTime(
  slot: Pick<PublicEventProgramEntry['slot'], 'startTime' | 'endTime' | 'startDayOffset' | 'endDayOffset'>, dayOffset: string,
): string {
  const range = formatTimeRangeLabel(slot.startTime, slot.endTime);
  if (!range || (!slot.startDayOffset && !slot.endDayOffset)) return range;
  const label = (time: string | null, offset: number | undefined) =>
    `${time ?? ''}${offset ? ' (' + dayOffset.replace('{{days}}', String(offset)) + ')' : ''}`;
  return `${label(slot.startTime, slot.startDayOffset)} - ${label(slot.endTime, slot.endDayOffset)}`;
}
