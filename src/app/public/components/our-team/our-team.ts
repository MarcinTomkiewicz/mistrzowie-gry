import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { provideTranslocoScope } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';

import { IGmPublicProfile } from '../../../core/interfaces/i-gm-public-profile';
import { GmRead } from '../../../core/services/gm-read/gm-read';
import { Seo } from '../../../core/services/seo/seo';
import { Storage } from '../../../core/services/storage/storage';
import { normalizeText } from '../../../core/utils/normalize-text';
import { LoadingOverlay } from '../../common/loading-overlay/loading-overlay';
import { createOurTeamI18n } from './our-team.i18n';

@Component({
  selector: 'app-our-team',
  standalone: true,
  imports: [CommonModule, LoadingOverlay],
  templateUrl: './our-team.html',
  styleUrl: './our-team.scss',
  providers: [provideTranslocoScope('ourTeam', 'common')],
})
export class OurTeam {
  private readonly gmRead = inject(GmRead);
  private readonly seo = inject(Seo);
  private readonly storage = inject(Storage);

  readonly i18n = createOurTeamI18n();
  readonly placeholderImageSrc = '/logo/logoMG-transparent.png';

  readonly profiles = toSignal(
    this.gmRead.getPublicProfiles().pipe(
      catchError(() => of([] as IGmPublicProfile[])),
    ),
    { initialValue: null },
  );

  readonly isLoading = computed(() => this.profiles() === null);

  readonly pageVm = computed(() => {
    const profiles = this.profiles();

    if (profiles === null) {
      return null;
    }

    return {
      page: this.i18n.page(),
      items: profiles.map((profile) => ({
        profile,
        displayName: this.gmRead.getDisplayName(profile),
        imageUrl: this.getImageUrl(profile),
        languageFlags:
          profile.profile.languages?.map((language) => ({
            id: language.id,
            label: language.label,
            className: this.getLanguageFlagClass(language.flagCode),
          })) ?? [],
      })),
    };
  });

  private readonly applySeoEffect = effect(() => {
    const seo = this.i18n.seo();
    const commonSeo = this.i18n.commonSeo();

    const title =
      seo.title?.trim() || commonSeo.defaultTitle?.trim() || 'Mistrzowie Gry';

    const description =
      seo.description?.trim() || commonSeo.defaultDescription?.trim() || '';

    this.seo.apply({
      title,
      description,
      og: {
        title,
        description,
      },
    });
  });

  private getImageUrl(profile: IGmPublicProfile): string | null {
    const imagePath = normalizeText(profile.profile.image);

    if (!imagePath) {
      return null;
    }

    return this.storage.getPublicUrl(imagePath);
  }

  private getLanguageFlagClass(flagCode: string | null | undefined): string {
    const code = normalizeText(flagCode)?.toLowerCase();

    if (!code) {
      return '';
    }

    return `fi fi-${code}`;
  }
}