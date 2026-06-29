import { Component, input, output } from '@angular/core';

import { ButtonModule } from 'primeng/button';

import { ISessionReservationAvailableSlot } from '../../../core/interfaces/i-session-reservation-availability';
import {
  ISessionReservationCommonI18n,
  ISessionReservationI18nSections,
} from '../../../core/interfaces/i-session-reservation-i18n';
import { formatDateLabel } from '../../../core/utils/date';
import { formatTimeLabel } from '../../../core/utils/time';

@Component({
  selector: 'app-session-reservation-slot-panel',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './session-reservation-slot-panel.html',
})
export class SessionReservationSlotPanel {
  readonly sections = input.required<ISessionReservationI18nSections['sections']>();
  readonly states = input.required<ISessionReservationI18nSections['states']>();
  readonly commonActions = input.required<ISessionReservationCommonI18n['commonActions']>();
  readonly commonStatus = input.required<ISessionReservationCommonI18n['commonStatus']>();
  readonly selectedGmId = input.required<string | null>();
  readonly selectedDate = input.required<string | null>();
  readonly selectedStartTime = input.required<string | null>();
  readonly availableSlots =
    input.required<readonly ISessionReservationAvailableSlot[]>();
  readonly isLoadingSlots = input.required<boolean>();

  readonly slotsRefresh = output<void>();
  readonly slotSelected = output<ISessionReservationAvailableSlot>();

  slotLabel(slot: ISessionReservationAvailableSlot): string {
    return `${formatDateLabel(slot.date, 'pl-PL', true)} ${formatTimeLabel(
      slot.startTime,
    )}`;
  }
}
