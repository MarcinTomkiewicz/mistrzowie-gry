import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';

import { SESSION_RESERVATION_CONFIG } from '../../configs/session-reservation.config';
import { IGmAvailabilitySlotRecord } from '../../interfaces/i-gm-availability';
import { IGmPublicProfile } from '../../interfaces/i-gm-public-profile';
import {
  ISessionReservationAvailableSlot,
  ISessionReservationGmSlot,
} from '../../interfaces/i-session-reservation-availability';
import { ISessionReservation } from '../../interfaces/i-session-reservation';
import { HOUR_IN_MS, MINUTE_IN_MS } from '../../types/hour-offset';
import { addDays, toIsoDate } from '../../utils/date';
import {
  ceilToTimeStep,
  createLocalDateTimeRangeIso,
  doTimeRangesOverlap,
  formatDateTimeAsTimeLabel,
} from '../../utils/time';
import { GmAvailability } from '../gm-availability/gm-availability';
import { SessionReservationService } from '../session-reservation/session-reservation';

@Injectable({ providedIn: 'root' })
export class SessionReservationAvailabilityService {
  private readonly gmAvailability = inject(GmAvailability);
  private readonly sessionReservation = inject(SessionReservationService);

  getAvailableSlotsForGm(
    gmProfileId: string,
    fromIso: string,
    toIsoExclusive: string,
    durationHours: number,
  ): Observable<ISessionReservationAvailableSlot[]> {
    return this.getAvailableSlotsForGms(
      [gmProfileId],
      fromIso,
      toIsoExclusive,
      durationHours,
    );
  }

  getAvailableGmsForSystemSlot(
    systemId: string,
    date: string,
    startTime: string,
    durationHours: number,
  ): Observable<IGmPublicProfile[]> {
    return this.sessionReservation.getGmsForSystem(systemId).pipe(
      switchMap((gms) =>
        this.getAvailableGmsFromCandidates(gms, date, startTime, durationHours),
      ),
    );
  }

  getAvailableGmsForSlot(
    date: string,
    startTime: string,
    durationHours: number,
  ): Observable<IGmPublicProfile[]> {
    return this.sessionReservation.getVisibleGms().pipe(
      switchMap((gms) =>
        this.getAvailableGmsFromCandidates(gms, date, startTime, durationHours),
      ),
    );
  }

  getNextSlotsForSystem(
    systemId: string,
    fromIso: string,
    durationHours: number,
  ): Observable<ISessionReservationGmSlot[]> {
    const toIsoExclusive = addDays(
      new Date(fromIso),
      SESSION_RESERVATION_CONFIG.bookingHorizonDays,
    ).toISOString();

    return this.sessionReservation.getGmsForSystem(systemId).pipe(
      switchMap((gms) => {
        if (!gms.length) {
          return of([] as ISessionReservationGmSlot[]);
        }

        return this.getAvailableSlotsForGms(
          gms.map((gm) => gm.profile.id),
          fromIso,
          toIsoExclusive,
          durationHours,
        ).pipe(
          map((slots) => {
            const gmById = new Map(gms.map((gm) => [gm.profile.id, gm]));

            return slots
              .map((slot) => {
                const gm = gmById.get(slot.gmProfileId);

                return gm ? { ...slot, gm } : null;
              })
              .filter(
                (slot): slot is ISessionReservationGmSlot => slot !== null,
              )
              .sort((left, right) =>
                left.startsAt.localeCompare(right.startsAt),
              );
          }),
        );
      }),
    );
  }

  private getAvailableGmsFromCandidates(
    gms: readonly IGmPublicProfile[],
    date: string,
    startTime: string,
    durationHours: number,
  ): Observable<IGmPublicProfile[]> {
    if (!gms.length) {
      return of([] as IGmPublicProfile[]);
    }

    const slotRange = createLocalDateTimeRangeIso(date, startTime, durationHours);
    const slotStart = Date.parse(slotRange.startsAt);
    const slotEnd = Date.parse(slotRange.endsAt);
    const gmProfileIds = gms.map((gm) => gm.profile.id);

    return forkJoin({
      availability: this.gmAvailability.getAvailabilityForGmsOverlapping(
        gmProfileIds,
        slotRange.startsAt,
        slotRange.endsAt,
      ),
      blockingReservations:
        this.sessionReservation.getBlockingReservationsForGms(
          gmProfileIds,
          slotRange.startsAt,
          slotRange.endsAt,
        ),
    }).pipe(
      map(({ availability, blockingReservations }) =>
        gms.filter((gm) =>
          this.isGmAvailableForRange(
            gm.profile.id,
            slotStart,
            slotEnd,
            availability,
            blockingReservations,
          ),
        ),
      ),
    );
  }

  private getAvailableSlotsForGms(
    gmProfileIds: readonly string[],
    fromIso: string,
    toIsoExclusive: string,
    durationHours: number,
  ): Observable<ISessionReservationAvailableSlot[]> {
    if (!gmProfileIds.length) {
      return of([]);
    }

    return forkJoin({
      availability: this.gmAvailability.getAvailabilityForGmsOverlapping(
        gmProfileIds,
        fromIso,
        toIsoExclusive,
      ),
      blockingReservations:
        this.sessionReservation.getBlockingReservationsForGms(
          gmProfileIds,
          fromIso,
          toIsoExclusive,
        ),
    }).pipe(
      map(({ availability, blockingReservations }) =>
        gmProfileIds
          .flatMap((gmProfileId) =>
            this.createAvailableSlots(
              gmProfileId,
              availability,
              blockingReservations,
              fromIso,
              toIsoExclusive,
              durationHours,
            ),
          )
          .sort((left, right) => left.startsAt.localeCompare(right.startsAt)),
      ),
    );
  }

  private createAvailableSlots(
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
          const endDate = new Date(slotEnd);

          slots.push({
            gmProfileId,
            startsAt: startDate.toISOString(),
            endsAt: endDate.toISOString(),
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

  private isGmAvailableForRange(
    gmProfileId: string,
    slotStart: number,
    slotEnd: number,
    availability: readonly IGmAvailabilitySlotRecord[],
    blockingReservations: readonly ISessionReservation[],
  ): boolean {
    const fitsAvailability = availability.some(
      (record) =>
        record.gmProfileId === gmProfileId &&
        Date.parse(record.startsAt) <= slotStart &&
        Date.parse(record.endsAt) >= slotEnd,
    );
    const hasBlockingReservation = blockingReservations.some(
      (reservation) =>
        reservation.gmProfileId === gmProfileId &&
        doTimeRangesOverlap(
          { start: slotStart, end: slotEnd },
          {
            start: Date.parse(reservation.startsAt),
            end: Date.parse(reservation.endsAt),
          },
        ),
    );

    return fitsAvailability && !hasBlockingReservation;
  }
}
