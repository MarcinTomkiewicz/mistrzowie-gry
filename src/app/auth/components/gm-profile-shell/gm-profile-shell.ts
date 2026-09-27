import { Component, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';

import { buildSiteUrl } from '../../../core/config/site';
import { createCommonNavI18n } from '../../../core/translations/common.i18n';
import type { RouteTabDefinition } from '../../../core/types/route-tab';
import { RouteTabShell } from '../../common/route-tab-shell/route-tab-shell';

@Component({
  selector: 'app-gm-profile-shell',
  imports: [RouterOutlet, RouteTabShell],
  providers: [provideTranslocoScope('common')],
  template: `
    <app-route-tab-shell
      [heading]="nav().gmProfile"
      [seoTitle]="nav().gmProfile"
      [canonicalUrl]="pageUrl"
      [tabs]="tabs()"
    >
      <router-outlet />
    </app-route-tab-shell>
  `,
})
export class GmProfileShell {
  protected readonly nav = createCommonNavI18n();
  protected readonly pageUrl = buildSiteUrl('/auth/gm/profile');
  protected readonly tabs = computed<readonly RouteTabDefinition[]>(() => [
    {
      id: 'profile',
      label: this.nav().gmProfile,
      icon: 'pi pi-blacksmith',
      path: '/auth/gm/profile',
    },
    {
      id: 'sessions',
      label: this.nav().gmSessions,
      icon: 'pi pi-evil-book',
      path: '/auth/gm/profile/sessions',
    },
    {
      id: 'availability',
      label: this.nav().gmAvailability,
      icon: 'pi pi-horus',
      path: '/auth/gm/profile/availability',
    },
  ]);
}
