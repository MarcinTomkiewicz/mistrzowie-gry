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

export function isSessionReservationSelectedSlot(
  slot: ISessionReservationAvailableSlot,
  selectedGmId: string | null,
  selectedDate: string | null,
  selectedStartTime: string | null,
  selectedDurationHours: number,
): boolean {
  return (
    selectedGmId === slot.gmProfileId &&
    selectedDate === slot.date &&
    selectedStartTime === slot.startTime &&
    selectedDurationHours === slot.durationHours
  );
}
