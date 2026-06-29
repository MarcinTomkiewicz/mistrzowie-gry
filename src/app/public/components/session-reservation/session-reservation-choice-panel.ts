import { Component, input } from '@angular/core';

import { ISessionReservationViewModel } from '../../../core/interfaces/i-session-reservation-view-model';

@Component({
  selector: 'app-session-reservation-choice-panel',
  standalone: true,
  templateUrl: './session-reservation-choice-panel.html',
})
export class SessionReservationChoicePanel {
  readonly data = input.required<ISessionReservationViewModel>();
}
