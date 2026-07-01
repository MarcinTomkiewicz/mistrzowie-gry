import { ISessionReservationAvailableSlot } from '../interfaces/i-session-reservation-availability';
import { formatDateLabel } from './date';
import { formatDateTimeAsTimeLabel, formatTimeRangeLabel } from './time';

export function formatSessionReservationSlotDateLabel(
  slot: ISessionReservationAvailableSlot,
): string {
  return formatDateLabel(slot.date, 'pl-PL', true);
}

export function formatSessionReservationSlotTimeRangeLabel(
  slot: ISessionReservationAvailableSlot,
): string {
  return formatTimeRangeLabel(
    slot.startTime,
    formatDateTimeAsTimeLabel(new Date(slot.endsAt)),
  );
}
