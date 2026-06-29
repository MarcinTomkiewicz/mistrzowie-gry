import { Component, input, output } from '@angular/core';

import {
  ISessionReservationCommonI18n,
  ISessionReservationI18nSections,
} from '../../../core/interfaces/i-session-reservation-i18n';
import { ISystem } from '../../../core/interfaces/i-system';

@Component({
  selector: 'app-session-reservation-system-panel',
  standalone: true,
  templateUrl: './session-reservation-system-panel.html',
})
export class SessionReservationSystemPanel {
  readonly sections = input.required<ISessionReservationI18nSections['sections']>();
  readonly states = input.required<ISessionReservationI18nSections['states']>();
  readonly commonStatus = input.required<ISessionReservationCommonI18n['commonStatus']>();
  readonly selectedGmId = input.required<string | null>();
  readonly selectedSystemId = input.required<string | null>();
  readonly systemsForSelectedGm = input.required<readonly ISystem[]>();
  readonly isLoadingSystems = input.required<boolean>();

  readonly systemSelected = output<string>();
}
