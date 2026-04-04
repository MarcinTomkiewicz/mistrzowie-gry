import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { provideTranslocoScope } from '@jsverse/transloco';

import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';

import { buildSiteUrl } from '../../../core/config/site';
import {
  EDIT_PROFILE_TABS,
  EditProfileTabDefinition,
  EditProfileTabId,
} from '../../../core/types/profile';
import { Auth } from '../../../core/services/auth/auth';
import { Seo } from '../../../core/services/seo/seo';
import { hasMinimumRole } from '../../../core/utils/roles';
import { ProfileForm } from '../../common/profile-form/profile-form';
import { GmAvailabilityComponent } from '../gm-availability/gm-availability';
import { GmProfile } from '../gm-profile/gm-profile';
import { GmSessions } from '../gm-sessions/gm-sessions';
import { createEditProfileI18n } from './edit-profile.i18n';

interface IEditProfileTabOption {
  value: EditProfileTabId;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TabsModule,
    SelectModule,
    ProfileForm,
    GmAvailabilityComponent,
    GmProfile,
    GmSessions,
  ],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.scss',
  providers: [provideTranslocoScope('auth', 'common')],
})
export class EditProfile {
  private static readonly DEFAULT_TAB: EditProfileTabId = 'profile';

  private readonly auth = inject(Auth);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seo = inject(Seo);
  private readonly pageUrl = buildSiteUrl('/auth/edit-profile');

  readonly i18n = createEditProfileI18n();

  readonly canSeeGmTabs = computed(() =>
    hasMinimumRole(this.auth.user(), 'gm'),
  );

  readonly tabs = computed(() =>
    [...EDIT_PROFILE_TABS]
      .filter((tab) => this.isTabVisible(tab.id))
      .sort((a, b) => a.order - b.order),
  );

  readonly tabOptions = computed<IEditProfileTabOption[]>(() =>
    this.tabs().map((tab) => ({
      value: tab.id,
      label: this.resolveTabLabel(tab.id),
      icon: tab.icon,
    })),
  );

  readonly activeTab = signal<EditProfileTabId>(this.resolveInitialTab());

  readonly mobileTabControl = new FormControl<EditProfileTabId>(
    this.activeTab(),
    { nonNullable: true },
  );

  constructor() {
    effect(() => {
      this.seo.apply({
        title: this.i18n.seo().title,
        description: this.i18n.seo().description,
        canonicalUrl: this.pageUrl,
        robots: 'noindex,nofollow',
      });
    });

    effect(() => {
      const activeTab = this.activeTab();

      if (!this.isTabVisible(activeTab)) {
        this.setActiveTab(EditProfile.DEFAULT_TAB);
        return;
      }

      if (this.mobileTabControl.value !== activeTab) {
        this.mobileTabControl.setValue(activeTab, { emitEvent: false });
      }
    });
  }

  resolveTabLabel(tabId: EditProfileTabId): string {
    const tabs = this.i18n.tabs();

    switch (tabId) {
      case 'profile':
        return tabs.profile;
      case 'gm-profile':
        return tabs.gmProfile;
      case 'gm-sessions':
        return tabs.gmSessions;
      case 'gm-availability':
        return tabs.gmAvailability;
    }
  }

  trackTab(_: number, tab: EditProfileTabDefinition): EditProfileTabId {
    return tab.id;
  }

  onTabChange(tabId: EditProfileTabId): void {
    if (!this.isTabVisible(tabId)) {
      return;
    }

    this.setActiveTab(tabId);
  }

  onMobileTabChange(tabId: EditProfileTabId | null): void {
    if (!tabId) {
      return;
    }

    this.onTabChange(tabId);
  }

  private resolveInitialTab(): EditProfileTabId {
    const tabFromQuery = this.route.snapshot.queryParamMap.get('tab');

    if (!this.isEditProfileTabId(tabFromQuery)) {
      return EditProfile.DEFAULT_TAB;
    }

    if (!this.isTabVisible(tabFromQuery)) {
      return EditProfile.DEFAULT_TAB;
    }

    return tabFromQuery;
  }

  private setActiveTab(tabId: EditProfileTabId): void {
    if (this.activeTab() === tabId) {
      return;
    }

    this.activeTab.set(tabId);

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private isEditProfileTabId(value: string | null): value is EditProfileTabId {
    return EDIT_PROFILE_TABS.some((tab) => tab.id === value);
  }

  private isTabVisible(tabId: EditProfileTabId): boolean {
    switch (tabId) {
      case 'profile':
        return true;
      case 'gm-profile':
      case 'gm-sessions':
      case 'gm-availability':
        return this.canSeeGmTabs();
    }
  }
}
