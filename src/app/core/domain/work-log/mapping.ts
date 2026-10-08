import { DEFAULT_TIMEZONE } from '../../configs/time.config';
import {
  IUserWorkLogDay,
  IUserWorkLogRecord,
} from '../../interfaces/i-work-log';
import { parseIsoDate } from '../../utils/date';
import { getHourOffsetFromDateTime } from '../../utils/hour-offset';
import { getTimeZoneWallTime } from '../../utils/time-zone';

export function mapWorkLogRecordsToDays(
  records: readonly IUserWorkLogRecord[],
): IUserWorkLogDay[] {
  return [...records]
    .map((record) => {
      const baseDate = parseIsoDate(record.workDate);

      if (!baseDate) {
        throw new Error(`Invalid Work Log date: ${record.workDate}`);
      }

      // Compare wall-clock times on a UTC axis, independent of DST and host zone.
      const baseTime = Date.UTC(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
      );
      const getOffset = (timestamp: string): number =>
        getHourOffsetFromDateTime(
          baseTime,
          new Date(
            getTimeZoneWallTime(new Date(timestamp).getTime(), DEFAULT_TIMEZONE),
          ),
        );

      const ranges = [...record.userWorkLogRanges]
        .map((range) => ({
          startOffset: getOffset(range.startsAt),
          endOffset: getOffset(range.endsAt),
        }))
        .sort((left, right) => left.startOffset - right.startOffset);

      return {
        id: record.id,
        date: record.workDate,
        ranges,
        isChaoticThursday: record.isChaoticThursday,
        comment: record.comment,
      };
    })
    .sort((left, right) => left.date.localeCompare(right.date));
}
