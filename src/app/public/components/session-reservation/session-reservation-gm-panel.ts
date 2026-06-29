import { Component, input, output } from '@angular/core';

import { ISessionReservationFlowState } from '../../../core/interfaces/i-session-reservation-flow';
import { ISessionReservationViewModel } from '../../../core/interfaces/i-session-reservation-view-model';
import { GmProfiles } from '../../common/gm-profiles/gm-profiles';

@Component({
  selector: 'app-session-reservation-gm-panel',
  standalone: true,
  imports: [GmProfiles],
  templateUrl: './session-reservation-gm-panel.html',
})
export class SessionReservationGmPanel {
  readonly data = input.required<ISessionReservationViewModel>();
  readonly state = input.required<ISessionReservationFlowState>();

  readonly gmSelected = output<string>();
}
