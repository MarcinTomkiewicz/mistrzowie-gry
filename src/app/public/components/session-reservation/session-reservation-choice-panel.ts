import { Component, input } from '@angular/core';

import { ISessionReservationI18nSections } from '../../../core/interfaces/i-session-reservation-i18n';

@Component({
  selector: 'app-session-reservation-choice-panel',
  standalone: true,
  templateUrl: './session-reservation-choice-panel.html',
})
export class SessionReservationChoicePanel {
  readonly sections = input.required<ISessionReservationI18nSections['sections']>();
  readonly labels = input.required<ISessionReservationI18nSections['labels']>();
}
