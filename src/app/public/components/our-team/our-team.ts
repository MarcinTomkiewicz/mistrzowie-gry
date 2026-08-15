import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { provideTranslocoScope } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';

import { buildSiteUrl } from '../../../core/config/site';
import { IGmPublicProfile } from '../../../core/interfaces/i-gm-public-profile';
import { GmRead } from '../../../core/reads/gm/gm-read';
import { ResponseStatus } from '../../../core/services/response-status/response-status';
import { Seo } from '../../../core/services/seo/seo';
import { Storage } from '../../../core/services/storage/storage';
import { normalizeText } from '../../../core/utils/normalize-text';
import {
  createOrganizationRef,
  createPageStructuredData,
} from '../../../core/utils/structured-data';
import { getGmPublicProfileDisplayName } from '../../../core/utils/user-display';
import { GmProfiles } from '../../common/gm-profiles/gm-profiles';
import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { GmProfileDialog } from '../gm-profile-dialog/gm-profile-dialog';
import { createOurTeamI18n } from './our-team.i18n';

@Component({
  selector: 'app-our-team',
  standalone: true,
  imports: [LoadingOverlay, GmProfiles, GmProfileDialog],
  templateUrl: './our-team.html',
  providers: [provideTranslocoScope('ourTeam', 'common')],
})
export class OurTeam {
  private readonly gmRead = inject(GmRead);
  private readonly responseStatus = inject(ResponseStatus);
  private readonly seo = inject(Seo);
  private readonly storage = inject(Storage);
  private readonly pageUrl = buildSiteUrl('/our-team');

  readonly i18n = createOurTeamI18n();

  readonly isDialogVisible = signal(false);
  readonly selectedProfile = signal<IGmPublicProfile | null>(null);
  readonly hasLoadError = signal(false);

  readonly profiles = toSignal(
    this.gmRead.getPublicProfiles().pipe(
      catchError((error: unknown) => {
        console.error('[our team] profile load error', error);
        this.hasLoadError.set(true);
        return of([] as IGmPublicProfile[]);
      }),
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
      profiles,
      hasLoadError: this.hasLoadError(),
    };
  });

  private readonly applySeoEffect = effect(() => {
    const seo = this.i18n.seo();
    const commonSeo = this.i18n.commonSeo();
    const commonErrors = this.i18n.commonErrors();
    const profiles = this.profiles();

    const title =
      this.i18n.page().title?.trim() ||
      commonSeo.defaultTitle?.trim() ||
      this.i18n.commonLabels().brandName;

    const description =
      seo.description?.trim() || commonSeo.defaultDescription?.trim() || '';

    if (this.hasLoadError()) {
      this.responseStatus.set(503);
      this.seo.apply({
        title,
        description: commonErrors.server,
        canonicalUrl: this.pageUrl,
        robots: 'noindex,nofollow',
        og: {
          title,
          description: commonErrors.server,
        },
      });
      return;
    }

    if (profiles !== null) {
      this.responseStatus.set(200);
    }

    this.seo.apply({
      title,
      description,
      canonicalUrl: this.pageUrl,
      og: {
        title,
        description,
      },
      structuredData:
        profiles === null
          ? undefined
          : this.buildStructuredData(title, description, profiles),
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

  private buildStructuredData(
    title: string,
    description: string,
    profiles: readonly IGmPublicProfile[],
  ) {
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
        name:
          getGmPublicProfileDisplayName(profile) ||
          this.i18n.commonAppRoles().gm,
        description: profileDescription,
        image: image ?? undefined,
        jobTitle: this.i18n.commonAppRoles().gm,
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
