import { Component, input, output } from '@angular/core';

import { IGmPublicProfile } from '../../../core/interfaces/i-gm-public-profile';
import { ISessionReservationI18nSections } from '../../../core/interfaces/i-session-reservation-i18n';
import { GmProfiles } from '../../common/gm-profiles/gm-profiles';

@Component({
  selector: 'app-session-reservation-gm-panel',
  standalone: true,
  imports: [GmProfiles],
  templateUrl: './session-reservation-gm-panel.html',
})
export class SessionReservationGmPanel {
  readonly sections = input.required<ISessionReservationI18nSections['sections']>();
  readonly states = input.required<ISessionReservationI18nSections['states']>();
  readonly selectedGmId = input.required<string | null>();
  readonly visibleGms = input.required<readonly IGmPublicProfile[]>();

  readonly gmSelected = output<string>();
}
