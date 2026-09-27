import { Component, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';

import { buildSiteUrl } from '../../../core/config/site';
import { createCommonNavI18n } from '../../../core/translations/common.i18n';
import type { RouteTabDefinition } from '../../../core/types/route-tab';
import { RouteTabShell } from '../../common/route-tab-shell/route-tab-shell';

@Component({
  selector: 'app-admin-user-shell',
  imports: [RouterOutlet, RouteTabShell],
  providers: [provideTranslocoScope('common')],
  template: `
    <app-route-tab-shell
      [heading]="nav().usersAdministration"
      [seoTitle]="nav().usersAdministration"
      [canonicalUrl]="pageUrl"
      [tabs]="tabs()"
    >
      <router-outlet />
    </app-route-tab-shell>
  `,
})
export class AdminUserShell {
  protected readonly nav = createCommonNavI18n();
  protected readonly pageUrl = buildSiteUrl('/auth/admin/users');
  protected readonly tabs = computed<readonly RouteTabDefinition[]>(() => [
    {
      id: 'users',
      label: this.nav().usersManagement,
      icon: 'pi pi-users',
      path: '/auth/admin/users',
    },
    {
      id: 'availability',
      label: this.nav().gmAvailabilityOverview,
      icon: 'pi pi-calendar',
      path: '/auth/admin/users/availability',
    },
    {
      id: 'work-log',
      label: this.nav().workLogOverview,
      icon: 'pi pi-clock',
      path: '/auth/admin/users/work-log',
    },
  ]);
}
