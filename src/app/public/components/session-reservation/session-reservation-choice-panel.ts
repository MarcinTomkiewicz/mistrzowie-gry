import { Component, input, output } from '@angular/core';

import { SESSION_RESERVATION_FLOW_MODES } from '../../../core/configs/session-reservation-flow-mode.config';
import { ISessionReservationFlowState } from '../../../core/interfaces/i-session-reservation-flow';
import { ISessionReservationViewModel } from '../../../core/interfaces/i-session-reservation-view-model';
import { SessionReservationFlowMode } from '../../../core/types/session-reservation-flow-mode';

@Component({
  selector: 'app-session-reservation-choice-panel',
  standalone: true,
  templateUrl: './session-reservation-choice-panel.html',
})
export class SessionReservationChoicePanel {
  readonly flowModes = SESSION_RESERVATION_FLOW_MODES;
  readonly data = input.required<ISessionReservationViewModel>();
  readonly state = input.required<ISessionReservationFlowState>();

  readonly flowModeSelected = output<SessionReservationFlowMode>();
}
