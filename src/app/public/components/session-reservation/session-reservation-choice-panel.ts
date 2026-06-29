import { Component, input, output } from '@angular/core';

import { ButtonModule } from 'primeng/button';

import { IGmPublicProfile } from '../../../core/interfaces/i-gm-public-profile';
import { ISessionBookingProduct } from '../../../core/interfaces/i-session-booking-product';
import { ISessionReservationAvailableSlot } from '../../../core/interfaces/i-session-reservation-availability';
import { ISessionReservationFlowState } from '../../../core/interfaces/i-session-reservation-flow';
import {
  ISessionReservationCommonI18n,
  ISessionReservationI18nSections,
} from '../../../core/interfaces/i-session-reservation-i18n';
import { ISystem } from '../../../core/interfaces/i-system';
import { formatDateLabel } from '../../../core/utils/date';
import { formatSessionBookingProductPriceLabel } from '../../../core/utils/session-pricing';
import { formatTimeLabel } from '../../../core/utils/time';
import { getGmPublicProfileDisplayName } from '../../../core/utils/user-display';

@Component({
  selector: 'app-session-reservation-choice-panel',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './session-reservation-choice-panel.html',
})
export class SessionReservationChoicePanel {
  readonly sections = input.required<ISessionReservationI18nSections['sections']>();
  readonly states = input.required<ISessionReservationI18nSections['states']>();
  readonly commonActions = input.required<ISessionReservationCommonI18n['commonActions']>();
  readonly commonStatus = input.required<ISessionReservationCommonI18n['commonStatus']>();
  readonly state = input.required<ISessionReservationFlowState>();
  readonly baseProducts = input.required<readonly ISessionBookingProduct[]>();
  readonly visibleGms = input.required<readonly IGmPublicProfile[]>();
  readonly systemsForSelectedGm = input.required<readonly ISystem[]>();
  readonly availableSlots = input.required<readonly ISessionReservationAvailableSlot[]>();
  readonly isLoadingSystems = input.required<boolean>();
  readonly isLoadingSlots = input.required<boolean>();

  readonly baseProductSelected = output<ISessionBookingProduct>();
  readonly gmSelected = output<string>();
  readonly systemSelected = output<string>();
  readonly slotsRefresh = output<void>();
  readonly slotSelected = output<ISessionReservationAvailableSlot>();
  readonly gmName = getGmPublicProfileDisplayName;
  readonly productPriceLabel = formatSessionBookingProductPriceLabel;

  isBaseProductSelected(product: ISessionBookingProduct): boolean {
    return this.state().selectedBaseProductSlug === product.slug;
  }

  slotLabel(slot: ISessionReservationAvailableSlot): string {
    return `${formatDateLabel(slot.date, 'pl-PL', true)} ${formatTimeLabel(
      slot.startTime,
    )}`;
  }
}
