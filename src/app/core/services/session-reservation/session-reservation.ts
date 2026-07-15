import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap, throwError } from 'rxjs';

import { SESSION_RESERVATION_SUBMIT_ERRORS } from '../../configs/session-reservation-submit-errors.config';
import { buildReservationPayload } from '../../factories/session-reservation-payload.factory';
import { buildSummaryPreview } from '../../factories/session-reservation-summary.factory';
import { ISessionReservation } from '../../interfaces/i-session-reservation';
import { ISessionReservationSubmitRequest } from '../../interfaces/i-session-reservation-finalization';
import { SessionReservationAvailabilityRead } from '../../reads/session-reservation/session-reservation-availability-read';
import { SessionReservationCreatePayload } from '../../types/session-reservation-create-payload';
import { Backend } from '../backend/backend';

@Injectable({ providedIn: 'root' })
export class SessionReservation {
  private readonly availability = inject(SessionReservationAvailabilityRead);
  private readonly backend = inject(Backend);

  createReservation(
    request: ISessionReservationSubmitRequest,
  ): Observable<ISessionReservation> {
    const summary = buildSummaryPreview(
      request.state,
      request.products,
      request.customerEntitlements,
    );

    if (!summary) {
      return throwError(
        () => new Error(SESSION_RESERVATION_SUBMIT_ERRORS.InvalidPayload),
      );
    }

    const payload = buildReservationPayload(
      request.state,
      summary,
      request.userId,
    );

    if (!payload) {
      return throwError(
        () => new Error(SESSION_RESERVATION_SUBMIT_ERRORS.InvalidPayload),
      );
    }

    return this.isPayloadSlotAvailable(payload).pipe(
      switchMap((isAvailable) =>
        isAvailable
          ? this.createSessionReservation(payload)
          : throwError(
              () =>
                new Error(SESSION_RESERVATION_SUBMIT_ERRORS.SlotUnavailable),
            ),
      ),
    );
  }

  private isPayloadSlotAvailable(
    payload: SessionReservationCreatePayload,
  ): Observable<boolean> {
    return this.availability
      .getNextReservationSlotsForGm(
        payload.gmProfileId,
        payload.durationHours,
      )
      .pipe(
        map((slots) =>
          slots.some(
            (slot) =>
              slot.startsAt === payload.startsAt &&
              slot.endsAt === payload.endsAt,
          ),
        ),
      );
  }

  private createSessionReservation(
    payload: SessionReservationCreatePayload,
  ): Observable<ISessionReservation> {
    return this.backend.create<
      ISessionReservation,
      SessionReservationCreatePayload
    >('session_reservations', payload);
  }
}
