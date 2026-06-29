import { Component, computed, inject, input, output } from '@angular/core';

import { IGmPublicProfile } from '../../../core/interfaces/i-gm-public-profile';
import { Storage } from '../../../core/services/storage/storage';
import { resolveLanguageFlagClass } from '../../../core/utils/language';
import { resolvePublicStorageUrl } from '../../../core/utils/storage-url';
import { getGmPublicProfileDisplayName } from '../../../core/utils/user-display';

@Component({
  selector: 'app-gm-profiles',
  standalone: true,
  templateUrl: './gm-profiles.html',
  styleUrl: './gm-profiles.scss',
})
export class GmProfiles {
  private readonly storage = inject(Storage);

  readonly profiles = input.required<readonly IGmPublicProfile[]>();
  readonly selectedProfileId = input<string | null>(null);

  readonly profileSelected = output<IGmPublicProfile>();
  readonly placeholderImageSrc = '/logo/logoMG-transparent.png';

  readonly items = computed(() =>
    this.profiles().map((profile) => ({
      profile,
      displayName: getGmPublicProfileDisplayName(profile),
      imageUrl:
        resolvePublicStorageUrl(this.storage, profile.profile.image) ??
        this.placeholderImageSrc,
      languageFlags:
        profile.profile.languages?.map((language) => ({
          id: language.id,
          label: language.label,
          className: resolveLanguageFlagClass(language.flagCode) ?? '',
        })) ?? [],
      lead: profile.profile.quote ?? profile.user.shortDescription ?? '',
    })),
  );
}
