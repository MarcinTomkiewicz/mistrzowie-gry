import { Component, effect, inject } from '@angular/core';

import { provideTranslocoScope } from '@jsverse/transloco';

import { buildSiteUrl } from '../../../core/config/site';
import { Seo } from '../../../core/services/seo/seo';
import { ProfileForm } from '../../common/profile-form/profile-form';
import { createEditProfileI18n } from './edit-profile.i18n';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [ProfileForm],
  templateUrl: './edit-profile.html',
  providers: [provideTranslocoScope('auth', 'common')],
})
export class EditProfile {
  private readonly seo = inject(Seo);
  protected readonly pageUrl = buildSiteUrl('/auth/edit-profile');

  readonly i18n = createEditProfileI18n();

  private readonly applySeoEffect = effect(() => {
    this.seo.apply({
      title: this.i18n.commonNav().editProfile,
      description: this.i18n.seo().description,
      canonicalUrl: this.pageUrl,
      robots: 'noindex,nofollow',
    });
  });
}
