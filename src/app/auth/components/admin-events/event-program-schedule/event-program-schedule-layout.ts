import { EventProgramItemStatus } from '../../../../core/enums/event';
import type { AdminEventTimeline, TimelineRow } from '../../../../core/interfaces/i-admin-event-timeline';
import { parseTimeLabelToMinutes } from '../../../../core/utils/time-format';
import { formatEventTimelineTime, type presentEventTimelineRows } from './event-program-schedule-presenter';

type Entry = ReturnType<typeof presentEventTimelineRows>[number];
type TimedEntry = { entry: Entry; start: number; end: number; space: Pick<AdminEventTimeline['spaces'][number], 'spaceId' | 'name'> | null };
type Lane = { space: TimedEntry['space']; end: number; entries: TimedEntry[] };
const DAY_MINUTES = 24 * 60;

function timeRange(row: TimelineRow): { start: number; end: number } | null {
  const startTime = parseTimeLabelToMinutes(row.startTime);
  const endTime = parseTimeLabelToMinutes(row.endTime);
  const start = startTime === null ? null : startTime + (row.source === 'manual' ? row.startDayOffset * DAY_MINUTES : 0);
  const end = endTime === null ? null : endTime + (row.source === 'manual' ? row.endDayOffset * DAY_MINUTES : 0);
  // Staffing and Legacy do not supply day offsets. Never infer a next-day date.
  return start !== null && end !== null && end > start ? { start, end } : null;
}

function spaceForRow(row: TimelineRow, spaces: AdminEventTimeline['spaces']): TimedEntry['space'] {
  if (row.source !== 'manual' || row.spaceId === null) return null;
  return spaces.find(space => space.spaceId === row.spaceId) ??
    (row.spaceName !== null ? { spaceId: row.spaceId, name: row.spaceName } : null);
}

export function eventProgramScheduleWindow(timeline: AdminEventTimeline) {
  const rows = timeline.occurrences.flatMap(day => day.rows);
  const ranges = rows.flatMap(row => { const range = timeRange(row); return range ? [range] : []; });
  if (!ranges.length) return null;
  const start = Math.floor(Math.min(...ranges.map(range => range.start)) / 60) * 60;
  const end = Math.ceil(Math.max(...ranges.map(range => range.end)) / 60) * 60;
  return {
    start, end,
    // A normal day fills the container; longer windows retain readable, scrollable pages.
    minimumWidthRem: Math.ceil((end - start) / (16 * 60)) * 36,
  };
}

// Geometry only: every block retains the canonical row and the existing presentation.
export function layoutEventProgramSchedule(entries: readonly Entry[], spaces: AdminEventTimeline['spaces'], dayOffset: string,
  window: ReturnType<typeof eventProgramScheduleWindow>) {
  const unplaced: Entry[] = [];
  const timed: TimedEntry[] = [];
  for (const entry of entries) {
    const row = entry.row;
    const range = timeRange(row);
    if (!range) { unplaced.push(entry); continue; }
    timed.push({ entry, ...range, space: spaceForRow(row, spaces) });
  }
  timed.sort((a, b) => a.start - b.start || a.end - b.end ||
    (a.entry.row.position ?? a.entry.row.displayOrder ?? 0) - (b.entry.row.position ?? b.entry.row.displayOrder ?? 0) ||
    a.entry.key.localeCompare(b.entry.key));
  if (!window) return { lanes: [], ticks: [], unplaced, hasSpaces: false };
  const { start, end } = window;
  const duration = end - start;
  const percent = (value: number) => (value - start) / duration * 100;
  const lanes: Lane[] = [];
  for (const item of timed) {
    let lane = lanes.find(lane => lane.space?.spaceId === item.space?.spaceId && lane.end <= item.start);
    if (!lane) { lane = { space: item.space, end: item.end, entries: [] }; lanes.push(lane); }
    lane.entries.push(item);
    lane.end = item.end;
  }
  // Keep physical rooms together even when overlapping entries need more than one track.
  lanes.sort((a, b) => (a.space?.name ?? '').localeCompare(b.space?.name ?? ''));
  const tickStep = duration <= 10 * 60 ? 60 : duration <= DAY_MINUTES ? 120 : 240;
  const minutes = Array.from({ length: Math.ceil(duration / tickStep) }, (_, index) => start + index * tickStep)
    .filter(minute => minute === start || end - minute >= tickStep * 0.75);
  const ticks = [...minutes, end].map(minute => {
    const clock = minute % DAY_MINUTES;
    const value = `${String(Math.floor(clock / 60)).padStart(2, '0')}:${String(clock % 60).padStart(2, '0')}`;
    return { minute, left: percent(minute), label: formatEventTimelineTime(value, Math.floor(minute / DAY_MINUTES), dayOffset) };
  });
  return {
    ticks, unplaced, hasSpaces: timed.some(item => item.space !== null),
    lanes: lanes.map((lane, index) => ({
      key: index, spaceName: lane.space?.name ?? null,
      entries: lane.entries.map(({ entry, start: itemStart, end: itemEnd }) => ({
        entry, left: percent(itemStart), width: (itemEnd - itemStart) / duration * 100,
        approved: entry.row.programStatus === EventProgramItemStatus.Approved || entry.row.programStatus === EventProgramItemStatus.Published,
        pending: entry.row.programStatus === EventProgramItemStatus.Submitted,
        inactive: entry.row.programStatus === EventProgramItemStatus.Rejected || entry.row.programStatus === EventProgramItemStatus.Withdrawn,
      })),
    })),
  };
}
