import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { provideTranslocoScope } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';

import { buildSiteUrl } from '../../../core/config/site';
import { IGmPublicProfile } from '../../../core/interfaces/i-gm-public-profile';
import { GmRead } from '../../../core/services/gm-read/gm-read';
import { Seo } from '../../../core/services/seo/seo';
import { Storage } from '../../../core/services/storage/storage';
import { resolveLanguageFlagClass } from '../../../core/utils/language';
import { normalizeText } from '../../../core/utils/normalize-text';
import {
  createOrganizationRef,
  createPageStructuredData,
} from '../../../core/utils/structured-data';
import { LoadingOverlay } from '../../common/loading-overlay/loading-overlay';
import { GmProfileDialog } from '../gm-profile-dialog/gm-profile-dialog';
import { createOurTeamI18n } from './our-team.i18n';

@Component({
  selector: 'app-our-team',
  standalone: true,
  imports: [CommonModule, LoadingOverlay, GmProfileDialog],
  templateUrl: './our-team.html',
  styleUrl: './our-team.scss',
  providers: [provideTranslocoScope('ourTeam', 'common')],
})
export class OurTeam {
  private readonly gmRead = inject(GmRead);
  private readonly seo = inject(Seo);
  private readonly storage = inject(Storage);
  private readonly pageUrl = buildSiteUrl('/our-team');

  readonly i18n = createOurTeamI18n();
  readonly placeholderImageSrc = '/logo/logoMG-transparent.png';

  readonly isDialogVisible = signal(false);
  readonly selectedProfile = signal<IGmPublicProfile | null>(null);

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
            className: resolveLanguageFlagClass(language.flagCode) ?? '',
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
      canonicalUrl: this.pageUrl,
      og: {
        title,
        description,
      },
      structuredData: this.buildStructuredData(title, description),
    });
  });

  openProfileDialog(profile: IGmPublicProfile): void {
    this.selectedProfile.set(profile);
    this.isDialogVisible.set(true);
  }

  onProfileChange(profile: IGmPublicProfile): void {
    this.selectedProfile.set(profile);
  }

  onDialogVisibleChange(visible: boolean): void {
    this.isDialogVisible.set(visible);

    if (!visible) {
      this.selectedProfile.set(null);
    }
  }

  private getImageUrl(profile: IGmPublicProfile): string | null {
    const imagePath = normalizeText(profile.profile.image);

    if (!imagePath) {
      return null;
    }

    return this.storage.getPublicUrl(imagePath);
  }
  private buildStructuredData(title: string, description: string) {
    const profiles = this.profiles() ?? [];

    const people = profiles.map((profile) => {
      const profileId = normalizeText(profile.profile.id) ?? profile.user.id;
      const image = this.getImageUrl(profile);
      const profileDescription =
        normalizeText(profile.profile.description) ??
        normalizeText(profile.user.shortDescription) ??
        normalizeText(profile.user.longDescription) ??
        undefined;

      return {
        '@type': 'Person',
        '@id': `${this.pageUrl}#person-${profileId}`,
        name: this.gmRead.getDisplayName(profile) || 'Mistrz Gry',
        description: profileDescription,
        image: image ?? undefined,
        jobTitle: 'Mistrz Gry',
        worksFor: createOrganizationRef(),
        knowsLanguage:
          profile.profile.languages.map((language) => language.label).filter(Boolean),
      };
    });

    return [
      createPageStructuredData({
        type: 'AboutPage',
        id: `${this.pageUrl}#webpage`,
        url: this.pageUrl,
        name: title,
        description,
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: people.map((person, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@id': person['@id'],
            },
          })),
        },
      }),
      ...people,
    ];
  }
}
