import { Component, input } from '@angular/core';

import { SESSION_RESERVATION_CONFIG } from '../../../core/configs/session-reservation.config';
import { IGmPublicProfile } from '../../../core/interfaces/i-gm-public-profile';
import {
  ISessionReservationFlowState,
  ISessionReservationSummaryPreview,
} from '../../../core/interfaces/i-session-reservation-flow';
import { ISessionReservationI18nSections } from '../../../core/interfaces/i-session-reservation-i18n';
import { ISystem } from '../../../core/interfaces/i-system';
import { formatMoney } from '../../../core/utils/pricing';
import { getGmPublicProfileDisplayName } from '../../../core/utils/user-display';

@Component({
  selector: 'app-session-reservation-summary-card',
  standalone: true,
  templateUrl: './session-reservation-summary-card.html',
})
export class SessionReservationSummaryCard {
  readonly sections = input.required<ISessionReservationI18nSections['sections']>();
  readonly labels = input.required<ISessionReservationI18nSections['labels']>();
  readonly states = input.required<ISessionReservationI18nSections['states']>();
  readonly state = input.required<ISessionReservationFlowState>();
  readonly summary = input.required<ISessionReservationSummaryPreview | null>();
  readonly selectedGm = input.required<IGmPublicProfile | null>();
  readonly selectedSystem = input.required<ISystem | null>();
  readonly gmName = getGmPublicProfileDisplayName;

  grossTotalLabel(value: number | null): string {
    return (
      formatMoney(value, SESSION_RESERVATION_CONFIG.currency) ??
      this.states().manualQuoteRequired
    );
  }
}
