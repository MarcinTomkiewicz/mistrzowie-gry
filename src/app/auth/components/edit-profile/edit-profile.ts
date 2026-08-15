import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { provideTranslocoScope } from '@jsverse/transloco';

import { buildSiteUrl } from '../../../core/config/site';
import { Auth } from '../../../core/services/auth/auth';
import type { RouteTabDefinition } from '../../../core/types/route-tab';
import { hasMinimumRole } from '../../../core/utils/roles';
import { RouteTabShell } from '../../common/route-tab-shell/route-tab-shell';
import { createEditProfileI18n } from './edit-profile.i18n';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [RouterOutlet, RouteTabShell],
  templateUrl: './edit-profile.html',
  providers: [provideTranslocoScope('auth', 'common')],
})
export class EditProfile {
  private readonly auth = inject(Auth);
  protected readonly pageUrl = buildSiteUrl('/auth/edit-profile');

  readonly i18n = createEditProfileI18n();

  readonly canSeeGmTabs = computed(() =>
    hasMinimumRole(this.auth.user(), 'gm'),
  );

  readonly tabs = computed<readonly RouteTabDefinition[]>(() => {
    const labels = this.i18n.tabs();
    const tabs: RouteTabDefinition[] = [
      {
        id: 'profile',
        label: labels.profile,
        icon: 'pi pi-overlord',
        path: '/auth/edit-profile/profile',
      },
    ];

    if (this.canSeeGmTabs()) {
      tabs.push(
        {
          id: 'gm-profile',
          label: labels.gmProfile,
          icon: 'pi pi-blacksmith',
          path: '/auth/edit-profile/gm-profile',
        },
        {
          id: 'gm-sessions',
          label: this.i18n.commonNav().gmSessions,
          icon: 'pi pi-evil-book',
          path: '/auth/edit-profile/gm-sessions',
        },
        {
          id: 'gm-availability',
          label: labels.gmAvailability,
          icon: 'pi pi-horus',
          path: '/auth/edit-profile/gm-availability',
        },
      );
    }

    return tabs;
  });
}
