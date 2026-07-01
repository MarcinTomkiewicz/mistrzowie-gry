import { Injectable, inject } from '@angular/core';
import { map, Observable, switchMap, throwError } from 'rxjs';

import { SESSION_RESERVATION_SUBMIT_ERRORS } from '../../configs/session-reservation-submit-errors.config';
import {
  ISessionReservation,
} from '../../interfaces/i-session-reservation';
import { ISessionReservationSubmitRequest } from '../../interfaces/i-session-reservation-finalization';
import { SessionReservationCreatePayload } from '../../types/session-reservation-create-payload';
import { SessionReservationAvailabilityService } from '../session-reservation-availability/session-reservation-availability';
import { SessionReservationPayloadService } from '../session-reservation-payload/session-reservation-payload';
import { SessionReservationService } from '../session-reservation/session-reservation';
import { SessionReservationSummaryService } from '../session-reservation-summary/session-reservation-summary';

@Injectable({ providedIn: 'root' })
export class SessionReservationSubmitService {
  private readonly availability = inject(SessionReservationAvailabilityService);
  private readonly payload = inject(SessionReservationPayloadService);
  private readonly reservation = inject(SessionReservationService);
  private readonly summary = inject(SessionReservationSummaryService);

  createReservation(
    request: ISessionReservationSubmitRequest,
  ): Observable<ISessionReservation> {
    const summary = this.summary.buildSummaryPreview(
      request.state,
      request.products,
      request.customerEntitlements,
    );

    if (!summary) {
      return throwError(
        () => new Error(SESSION_RESERVATION_SUBMIT_ERRORS.InvalidPayload),
      );
    }

    const payload = this.payload.buildCreatePayload(
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
          ? this.reservation.createSessionReservation(payload)
          : throwError(
              () => new Error(SESSION_RESERVATION_SUBMIT_ERRORS.SlotUnavailable),
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
}
