import { Component, input } from '@angular/core';

import { SESSION_RESERVATION_CONFIG } from '../../../core/configs/session-reservation.config';
import { ISessionReservationFlowState } from '../../../core/interfaces/i-session-reservation-flow';
import { ISessionReservationViewModel } from '../../../core/interfaces/i-session-reservation-view-model';
import { formatMoney } from '../../../core/utils/pricing';
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

  grossTotalLabel(value: number | null): string {
    return (
      formatMoney(value, SESSION_RESERVATION_CONFIG.currency) ??
      this.data().states.manualQuoteRequired
    );
  }
}
