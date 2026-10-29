import { EventProgramItemStatus } from '../../../../core/enums/event';
import type { TimelineRow } from '../../../../core/interfaces/i-admin-event-timeline';
import { formatTimeLabel } from '../../../../core/utils/time-format';
import type { createEventAdminTimelineI18n } from './event-admin-timeline.i18n';

export function presentEventTimelineRows(rows: readonly TimelineRow[], i18n: ReturnType<typeof createEventAdminTimelineI18n>) {
  const copy = i18n.copy();
  const values = i18n.values();
  const statuses = i18n.entityStatuses();
  const candidateStates = { ...copy.candidateStates, pending: i18n.statusPhrases().awaitingAcceptance };
  const time = (value: string, offset: number) => formatTimeLabel(value) +
    (offset ? ` (${copy.dayOffset.replace('{{days}}', String(offset))})` : '');
  return rows.map(row => {
    const activity = row.source === 'manual' ? row.activity : null;
    const rpg = row.session !== null || row.programItemId !== null;
    return {
      key: `${row.source}:${row.slotId ?? ''}:${row.sourceFinalPlanItemId ?? row.programItemId ?? ''}`,
      participantProgramItemId: row.programItemId && row.session !== null &&
        (row.programStatus === EventProgramItemStatus.Approved || row.programStatus === EventProgramItemStatus.Published)
        ? row.programItemId : null,
      row,
      title: activity ? activity.title : rpg ? row.session?.title ?? values.notProvided : row.slotLabel ?? copy.unassigned,
      kind: activity ? activity.kindLabel ?? activity.kindKey : rpg ? copy.rpgSession : copy.unassigned,
      host: activity ? activity.presenter ?? values.notProvided : row.host?.displayName ?? copy.noHost,
      time: `${time(row.startTime, row.source === 'manual' ? row.startDayOffset : 0)} - ${time(row.endTime, row.source === 'manual' ? row.endDayOffset : 0)}`,
      status: statuses[row.status].feminine,
      programStatus: row.programStatus === null ? null : statuses[row.programStatus].feminine,
      source: copy.sources[row.source],
      candidate: row.source === 'staffing' && row.candidateState !== null ? candidateStates[row.candidateState] : null,
    };
  });
}
