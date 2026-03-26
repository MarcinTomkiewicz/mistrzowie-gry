import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { provideTranslocoScope } from '@jsverse/transloco';

import { TabsModule } from 'primeng/tabs';

import {
  EDIT_PROFILE_TABS,
  EditProfileTabDefinition,
  EditProfileTabId,
} from '../../../core/types/profile';
import { Auth } from '../../../core/services/auth/auth';
import { hasMinimumRole } from '../../../core/utils/roles';
import { ProfileForm } from '../../common/profile-form/profile-form';
import { GmProfile } from '../gm-profile/gm-profile';
import { createEditProfileI18n } from './edit-profile.i18n';
import { GmSessions } from '../gm-sessions/gm-sessions';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, TabsModule, ProfileForm, GmProfile, GmSessions],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.scss',
  providers: [provideTranslocoScope('auth', 'common')],
})
export class EditProfile {
  private readonly auth = inject(Auth);

  readonly i18n = createEditProfileI18n();

  readonly canSeeGmTabs = computed(() =>
    hasMinimumRole(this.auth.user(), 'gm'),
  );

  readonly tabs = computed(() =>
    [...EDIT_PROFILE_TABS]
      .filter((tab) => this.isTabVisible(tab.id))
      .sort((a, b) => a.order - b.order),
  );

  resolveTabLabel(tabId: EditProfileTabId): string {
    switch (tabId) {
      case 'profile':
        return this.i18n.profileTabLabel();
      case 'gm-profile':
        return this.i18n.gmProfileTabLabel();
      case 'gm-sessions':
        return this.i18n.gmSessionsTabLabel();
    }
  }

  trackTab(_: number, tab: EditProfileTabDefinition): EditProfileTabId {
    return tab.id;
  }

  private isTabVisible(tabId: EditProfileTabId): boolean {
    switch (tabId) {
      case 'profile':
        return true;
      case 'gm-profile':
      case 'gm-sessions':
        return this.canSeeGmTabs();
    }
  }
}