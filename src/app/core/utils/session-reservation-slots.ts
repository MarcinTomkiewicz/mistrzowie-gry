import { SESSION_RESERVATION_CONFIG } from '../configs/session-reservation.config';
import { IGmAvailabilitySlotRecord } from '../interfaces/i-gm-availability';
import { ISessionReservationAvailableSlot } from '../interfaces/i-session-reservation-availability';
import { ISessionReservation } from '../interfaces/i-session-reservation';
import { HOUR_IN_MS, MINUTE_IN_MS } from '../types/hour-offset';
import { addMonths, formatDateLabel, startOfMonth, toIsoDate } from './date';
import {
  ceilToTimeStep,
  doTimeRangesOverlap,
  formatDateTimeAsTimeLabel,
  formatTimeRangeLabel,
} from './time';

export function resolveSessionReservationAvailabilityWindow(now: Date): {
  fromIso: string;
  toIsoExclusive: string;
} {
  return {
    fromIso: new Date(
      now.getTime() + SESSION_RESERVATION_CONFIG.minLeadTimeHours * HOUR_IN_MS,
    ).toISOString(),
    toIsoExclusive: startOfMonth(addMonths(now, 2)).toISOString(),
  };
}

export function createSessionReservationAvailableSlots(
  gmProfileId: string,
  availability: readonly IGmAvailabilitySlotRecord[],
  blockingReservations: readonly ISessionReservation[],
  fromIso: string,
  toIsoExclusive: string,
  durationHours: number,
): ISessionReservationAvailableSlot[] {
  const fromTime = Date.parse(fromIso);
  const toTime = Date.parse(toIsoExclusive);
  const durationMs = durationHours * HOUR_IN_MS;
  const stepMs = SESSION_RESERVATION_CONFIG.slotStepMinutes * MINUTE_IN_MS;
  const gmAvailability = availability.filter(
    (record) => record.gmProfileId === gmProfileId,
  );
  const gmBlockingReservations = blockingReservations.filter(
    (reservation) => reservation.gmProfileId === gmProfileId,
  );
  const slots: ISessionReservationAvailableSlot[] = [];

  for (const record of gmAvailability) {
    const availabilityStart = Math.max(Date.parse(record.startsAt), fromTime);
    const availabilityEnd = Math.min(Date.parse(record.endsAt), toTime);
    let slotStart = ceilToTimeStep(availabilityStart, stepMs);

    while (slotStart + durationMs <= availabilityEnd) {
      const slotEnd = slotStart + durationMs;
      const isBlocked = gmBlockingReservations.some((reservation) =>
        doTimeRangesOverlap(
          { start: slotStart, end: slotEnd },
          {
            start: Date.parse(reservation.startsAt),
            end: Date.parse(reservation.endsAt),
          },
        ),
      );

      if (!isBlocked) {
        const startDate = new Date(slotStart);

        slots.push({
          gmProfileId,
          startsAt: startDate.toISOString(),
          endsAt: new Date(slotEnd).toISOString(),
          date: toIsoDate(startDate),
          startTime: formatDateTimeAsTimeLabel(startDate),
          durationHours,
        });
      }

      slotStart += stepMs;
    }
  }

  return slots;
}

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
