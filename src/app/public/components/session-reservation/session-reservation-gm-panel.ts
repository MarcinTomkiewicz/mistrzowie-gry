import { Component, inject, input, output } from '@angular/core';

import { IGmPublicProfile } from '../../../core/interfaces/i-gm-public-profile';
import { ISessionReservationI18nSections } from '../../../core/interfaces/i-session-reservation-i18n';
import { Storage } from '../../../core/services/storage/storage';
import { resolvePublicStorageUrl } from '../../../core/utils/storage-url';
import { getGmPublicProfileDisplayName } from '../../../core/utils/user-display';

@Component({
  selector: 'app-session-reservation-gm-panel',
  standalone: true,
  templateUrl: './session-reservation-gm-panel.html',
})
export class SessionReservationGmPanel {
  private readonly storage = inject(Storage);

  readonly sections = input.required<ISessionReservationI18nSections['sections']>();
  readonly states = input.required<ISessionReservationI18nSections['states']>();
  readonly selectedGmId = input.required<string | null>();
  readonly visibleGms = input.required<readonly IGmPublicProfile[]>();

  readonly gmSelected = output<string>();
  readonly gmName = getGmPublicProfileDisplayName;
  readonly placeholderImageSrc = '/logo/logoMG-transparent.png';

  gmImageUrl(gm: IGmPublicProfile): string {
    return (
      resolvePublicStorageUrl(this.storage, gm.profile.image) ??
      this.placeholderImageSrc
    );
  }

  gmLead(gm: IGmPublicProfile): string {
    return gm.profile.quote ?? gm.user.shortDescription ?? '';
  }
}
