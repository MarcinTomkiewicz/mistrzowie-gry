import type { IEventSlotCardVm } from '../interfaces/i-event-slot-card';
import type { IPublicStorageUrlResolver } from '../interfaces/i-storage';
import type { EventPageProgramTranslations } from '../types/i18n/event-page';
import type { PublicEventProgramEntry } from '../types/public-event-program';
import { resolvePublicStorageUrl } from './storage-url';
import { normalizeText } from './normalize-text';
import { formatTimeRangeLabel, getTimeRangeBounds } from './time-format';

type PublicEventProgramGroup = Pick<PublicEventProgramEntry['slot'], 'startTime' | 'endTime' | 'startDayOffset' | 'endDayOffset'> & {
  key: string;
  label: string;
  slotLabel: string | null;
  eventScoped: boolean;
  entries: PublicEventProgramEntry[];
};

export function groupPublicEventProgramEntries(
  entries: readonly PublicEventProgramEntry[],
  copy: EventPageProgramTranslations,
  eventName: string,
): PublicEventProgramGroup[] {
  const eventLabel = normalizeText(eventName)?.toLocaleLowerCase('pl-PL');
  const groups = new Map<string, Omit<PublicEventProgramGroup, 'label' | 'slotLabel'>>();
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
  }).map(group => {
    const firstLabel = normalizeText(group.entries[0].slot.label);
    const key = firstLabel?.toLocaleLowerCase('pl-PL');
    const slotLabel = key && key !== eventLabel &&
      group.entries.every(entry => normalizeText(entry.slot.label)?.toLocaleLowerCase('pl-PL') === key) &&
      group.entries.some(entry => normalizeText('activity' in entry ? entry.activity.title : entry.session?.title)?.toLocaleLowerCase('pl-PL') !== key)
      ? firstLabel : null;
    const timeLabel = group.eventScoped ? copy.eventScoped : formatPublicEventProgramTime(group, copy.dayOffset) || copy.timeToBeDetermined;
    return { ...group, slotLabel, label: slotLabel ? `${slotLabel} - ${timeLabel}` : timeLabel };
  });
}

export function createPublicEventProgramCards(
  entries: readonly PublicEventProgramEntry[],
  storage: IPublicStorageUrlResolver,
  copy: EventPageProgramTranslations,
  missingTitle: string,
  gmLabel: string,
  eventName: string,
  group?: PublicEventProgramGroup,
): IEventSlotCardVm[] {
  const eventLabel = normalizeText(eventName)?.toLocaleLowerCase('pl-PL');
  return entries.map((entry) => {
    const pending = entry.kind === 'pending';
    const activity = 'activity' in entry ? entry.activity : null;
    const session = entry.session;
    const slotLabel = normalizeText(entry.slot.label);
    const title = pending ? copy.pending : activity?.title ?? normalizeText(session?.title) ?? missingTitle;
    const slotKey = slotLabel?.toLocaleLowerCase('pl-PL');
    const sharedLabel = group?.slotLabel?.toLocaleLowerCase('pl-PL');
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
      slotLabel: slotKey === eventLabel || group && (slotKey === sharedLabel || slotKey === normalizeText(title)?.toLocaleLowerCase('pl-PL')) ? null : slotLabel,
      timeLabel: group ? undefined : formatPublicEventProgramTime(entry.slot, copy.dayOffset),
      sessionDetails: session ? { ...session, title, ...(system ? { system } : {}) } : null,
      ...(activity ? { activity } : {}),
    };
  });
}

export function getPublicEventProgramTimeRange(
  entries: readonly PublicEventProgramEntry[],
  eventHours: ReturnType<typeof getTimeRangeBounds>,
): ReturnType<typeof getTimeRangeBounds> {
  // Event-scoped sessions have an Event window, never individual session hours.
  if (entries.some(entry => entry.kind === 'confirmed' && 'timeScope' in entry && entry.timeScope === 'event')) return eventHours;
  const range = getTimeRangeBounds(entries.map(entry => entry.slot));
  if (range) return range;
  // A date-only pending item does not establish any actual program hours.
  return entries.some(entry => entry.kind === 'pending' && entry.slot.startTime === null) ? null : eventHours;
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
