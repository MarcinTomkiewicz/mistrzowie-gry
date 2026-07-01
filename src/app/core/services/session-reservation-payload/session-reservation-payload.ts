import { Injectable } from '@angular/core';

import { SESSION_RESERVATION_CONFIG } from '../../configs/session-reservation.config';
import { ISessionReservationCreateBase } from '../../interfaces/i-session-reservation';
import {
  ISessionReservationFinalSummaryPreview,
} from '../../interfaces/i-session-reservation-finalization';
import { ISessionReservationFlowState } from '../../interfaces/i-session-reservation-flow';
import { SESSION_BOOKING_MODES } from '../../types/session-booking-mode';
import { SessionReservationCreatePayload } from '../../types/session-reservation-create-payload';
import { SESSION_RESERVATION_SOURCE_KINDS } from '../../types/session-reservation-source-kind';
import { createLocalDateTimeRangeIso } from '../../utils/time';

@Injectable({ providedIn: 'root' })
export class SessionReservationPayloadService {
  buildCreatePayload(
    state: ISessionReservationFlowState,
    summary: ISessionReservationFinalSummaryPreview,
    userId: string | null,
  ): SessionReservationCreatePayload | null {
    if (
      !state.selectedGmId ||
      !state.selectedSystemId ||
      !state.selectedDate ||
      !state.selectedStartTime
    ) {
      return null;
    }

    const { startsAt, endsAt } = createLocalDateTimeRangeIso(
      state.selectedDate,
      state.selectedStartTime,
      state.selectedDurationHours,
    );
    const base: ISessionReservationCreateBase = {
      userId,
      gmProfileId: state.selectedGmId,
      systemId: state.selectedSystemId,
      status: SESSION_RESERVATION_CONFIG.publicCreatedStatus,
      startsAt,
      endsAt,
      durationHours: state.selectedDurationHours,
      baseProductId: summary.baseProduct.id,
      customerName: state.contact.customerName.trim(),
      customerEmail: state.contact.customerEmail.trim(),
      customerPhone: state.contact.customerPhone?.trim() || null,
      playersCount: state.playersCount,
      message: state.gmExtraInfo.message,
      createCharactersAtTable: state.gmExtraInfo.createCharactersAtTable,
      provideCharacterGuidelines: state.gmExtraInfo.provideCharacterGuidelines,
      characterGuidelines: state.gmExtraInfo.characterGuidelines,
      extraNotes: state.gmExtraInfo.extraNotes,
      addonsSnapshotJson: [...summary.addonsSnapshot],
      customServicesRequest: state.customServicesRequest,
      pricingSnapshotJson: summary.pricingSnapshot,
      grossTotalPln: summary.grossTotalPln,
      currency: SESSION_RESERVATION_CONFIG.currency,
      priceStatus: summary.pricingSnapshot.priceStatus,
    };
    const source = {
      sourceKind: SESSION_RESERVATION_SOURCE_KINDS.SystemOnly,
      gmSessionTemplateId: null,
      customSessionId: null,
    } as const;

    if (
      state.bookingMode === SESSION_BOOKING_MODES.PackageCredit ||
      state.bookingMode === SESSION_BOOKING_MODES.SubscriptionCredit
    ) {
      if (!summary.customerEntitlement) {
        return null;
      }

      return {
        ...base,
        ...source,
        bookingMode: state.bookingMode,
        customerEntitlementId: summary.customerEntitlement.id,
      };
    }

    return {
      ...base,
      ...source,
      bookingMode: state.bookingMode,
      customerEntitlementId: null,
    };
  }
}
