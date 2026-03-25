import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';

import { provideTranslocoScope } from '@jsverse/transloco';

import { TabsModule } from 'primeng/tabs';

import { Seo } from '../../../core/services/seo/seo';
import { createEditProfileI18n } from './edit-profile.i18n';
import { ProfileForm } from '../../common/profile-form/profile-form';
import { EDIT_PROFILE_TABS, EditProfileTabId } from '../../../core/types/profile';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, TabsModule, ProfileForm],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.scss',
  providers: [provideTranslocoScope('auth', 'common')],
})
export class EditProfile {
  private readonly seo = inject(Seo);

  readonly i18n = createEditProfileI18n();
  readonly tabs = EDIT_PROFILE_TABS;

  private readonly seoEffect = effect(() => {
    this.seo.apply({
      title: this.i18n.seoTitle(),
      description: this.i18n.seoDescription(),
      canonicalUrl: 'https://mistrzowie-gry.pl/auth/edit-profile',
    });
  });

  resolveTabLabel(tabId: EditProfileTabId): string {
    switch (tabId) {
      case 'profile':
        return this.i18n.profileTabLabel();
    }
  }
}