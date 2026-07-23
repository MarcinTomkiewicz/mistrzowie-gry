import { Component, input } from '@angular/core';

import { SESSION_RESERVATION_CONFIG } from '../../../core/configs/session-reservation.config';
import { ISessionReservationFlowState } from '../../../core/interfaces/i-session-reservation-flow';
import { ISessionReservationViewModel } from '../../../core/interfaces/i-session-reservation-view-model';
import { formatDateLabel } from '../../../core/utils/date';
import { formatMoney } from '../../../core/utils/pricing';
import {
  formatDateTimeAsTimeLabel,
  formatTimeRangeLabel,
} from '../../../core/utils/time-format';
import { createLocalDateTimeRangeIso } from '../../../core/utils/time-zone';
import { getGmPublicProfileDisplayName } from '../../../core/utils/user-display';

@Component({
  selector: 'app-session-reservation-summary-card',
  standalone: true,
  templateUrl: './session-reservation-summary-card.html',
})
export class SessionReservationSummaryCard {
  readonly data = input.required<ISessionReservationViewModel>();
  readonly state = input.required<ISessionReservationFlowState>();
  readonly gmName = getGmPublicProfileDisplayName;

  summary() {
    return this.data().summary;
  }

  grossTotalLabel(value: number | null): string {
    return (
      formatMoney(value, SESSION_RESERVATION_CONFIG.currency) ??
      this.data().states.manualQuoteRequired
    );
  }

  selectedSlotLabel(): string {
    const state = this.state();

    if (!state.selectedDate || !state.selectedStartTime) {
      return '';
    }

    const { endsAt } = createLocalDateTimeRangeIso(
      state.selectedDate,
      state.selectedStartTime,
      state.selectedDurationHours,
    );

    return `${formatDateLabel(state.selectedDate, 'pl-PL')}, ${formatTimeRangeLabel(
      state.selectedStartTime,
      formatDateTimeAsTimeLabel(new Date(endsAt)),
    )}`;
  }

  lineItemTotalLabel(value: number | null): string {
    return (
      formatMoney(value, SESSION_RESERVATION_CONFIG.currency) ??
      this.data().states.manualQuoteRequired
    );
  }
}
