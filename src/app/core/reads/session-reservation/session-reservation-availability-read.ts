import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';

import { IGmPublicProfile } from '../../interfaces/i-gm-public-profile';
import {
  ISessionReservationAvailableSlot,
  ISessionReservationGmSlot,
} from '../../interfaces/i-session-reservation-availability';
import { GmAvailability } from '../../services/gm-availability/gm-availability';
import {
  createSessionReservationAvailableSlots,
  resolveSessionReservationAvailabilityWindow,
} from '../../domain/session-reservation/slots';
import { createLocalDateTimeRangeIso } from '../../utils/time-zone';
import { SessionReservationRead } from './session-reservation-read';

@Injectable({ providedIn: 'root' })
export class SessionReservationAvailabilityRead {
  private readonly gmAvailability = inject(GmAvailability);
  private readonly reservationRead = inject(SessionReservationRead);

  getNextReservationSlotsForSystem(
    systemId: string,
    durationHours: number,
  ): Observable<ISessionReservationGmSlot[]> {
    const { fromIso, toIsoExclusive } =
      resolveSessionReservationAvailabilityWindow(new Date());

    return this.getSlotsForSystem(
      systemId,
      fromIso,
      toIsoExclusive,
      durationHours,
    );
  }

  getNextReservationSlotsForGm(
    gmProfileId: string,
    durationHours: number,
  ): Observable<ISessionReservationAvailableSlot[]> {
    const { fromIso, toIsoExclusive } =
      resolveSessionReservationAvailabilityWindow(new Date());

    return this.getAvailableSlotsForGms(
      [gmProfileId],
      fromIso,
      toIsoExclusive,
      durationHours,
    );
  }

  getAvailableGmsForReservationSystem(
    systemId: string,
    durationHours: number,
  ): Observable<IGmPublicProfile[]> {
    return this.getNextReservationSlotsForSystem(systemId, durationHours).pipe(
      map((slots) => [
        ...new Map(
          slots.map((slot) => [slot.gm.profile.id, slot.gm]),
        ).values(),
      ]),
    );
  }

  getNearestFallbackSlotsForReservationSystem(
    systemId: string,
    durationHours: number,
    excludedGmId: string | null,
    limit: number,
  ): Observable<ISessionReservationGmSlot[]> {
    return this.getNextReservationSlotsForSystem(systemId, durationHours).pipe(
      map((slots) =>
        slots
          .filter((slot) => !excludedGmId || slot.gmProfileId !== excludedGmId)
          .slice(0, limit),
      ),
    );
  }

  getAvailableGmsForReservationSlot(
    date: string,
    startTime: string,
    durationHours: number,
    excludedGmId: string | null = null,
  ): Observable<IGmPublicProfile[]> {
    const { startsAt, endsAt } = createLocalDateTimeRangeIso(
      date,
      startTime,
      durationHours,
    );

    return this.reservationRead.getVisibleGms().pipe(
      switchMap((gms) => {
        if (!gms.length) {
          return of([] as IGmPublicProfile[]);
        }

        return this.getAvailableSlotsForGms(
          gms.map((gm) => gm.profile.id),
          startsAt,
          endsAt,
          durationHours,
        ).pipe(
          map((slots) => {
            const availableGmIds = new Set(
              slots
                .filter((slot) => slot.startsAt === startsAt)
                .map((slot) => slot.gmProfileId),
            );

            return gms
              .filter((gm) => availableGmIds.has(gm.profile.id))
              .filter((gm) => !excludedGmId || gm.profile.id !== excludedGmId);
          }),
        );
      }),
    );
  }

  private getSlotsForSystem(
    systemId: string,
    fromIso: string,
    toIsoExclusive: string,
    durationHours: number,
  ): Observable<ISessionReservationGmSlot[]> {
    return this.reservationRead.getGmsForSystem(systemId).pipe(
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
        this.reservationRead.getBlockingReservationsForGms(
          gmProfileIds,
          fromIso,
          toIsoExclusive,
        ),
    }).pipe(
      map(({ availability, blockingReservations }) =>
        gmProfileIds
          .flatMap((gmProfileId) =>
            createSessionReservationAvailableSlots(
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
}
