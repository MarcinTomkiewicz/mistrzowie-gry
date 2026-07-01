import { Component, input, output } from '@angular/core';

import { SESSION_RESERVATION_FLOW_MODES } from '../../../core/configs/session-reservation-flow-mode.config';
import { ISessionReservationFlowState } from '../../../core/interfaces/i-session-reservation-flow';
import { ISessionReservationViewModel } from '../../../core/interfaces/i-session-reservation-view-model';

@Component({
  selector: 'app-session-reservation-system-panel',
  standalone: true,
  templateUrl: './session-reservation-system-panel.html',
})
export class SessionReservationSystemPanel {
  readonly flowModes = SESSION_RESERVATION_FLOW_MODES;
  readonly data = input.required<ISessionReservationViewModel>();
  readonly state = input.required<ISessionReservationFlowState>();

  readonly systemSelected = output<string>();
}
