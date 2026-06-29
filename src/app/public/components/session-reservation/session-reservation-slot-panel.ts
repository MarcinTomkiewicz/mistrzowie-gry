import { Component, input, output } from '@angular/core';

import { ButtonModule } from 'primeng/button';

import { ISessionReservationAvailableSlot } from '../../../core/interfaces/i-session-reservation-availability';
import { ISessionReservationFlowState } from '../../../core/interfaces/i-session-reservation-flow';
import { ISessionReservationViewModel } from '../../../core/interfaces/i-session-reservation-view-model';
import { formatDateLabel } from '../../../core/utils/date';
import { formatTimeLabel } from '../../../core/utils/time';

@Component({
  selector: 'app-session-reservation-slot-panel',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './session-reservation-slot-panel.html',
})
export class SessionReservationSlotPanel {
  readonly data = input.required<ISessionReservationViewModel>();
  readonly state = input.required<ISessionReservationFlowState>();

  readonly slotsRefresh = output<void>();
  readonly slotSelected = output<ISessionReservationAvailableSlot>();

  slotLabel(slot: ISessionReservationAvailableSlot): string {
    return `${formatDateLabel(slot.date, 'pl-PL', true)} ${formatTimeLabel(
      slot.startTime,
    )}`;
  }
}
