import { Component, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';

import { buildSiteUrl } from '../../../core/config/site';
import { createCommonNavI18n } from '../../../core/translations/common.i18n';
import type { RouteTabDefinition } from '../../../core/types/route-tab';
import { RouteTabShell } from '../../common/route-tab-shell/route-tab-shell';

@Component({
  selector: 'app-admin-content-shell',
  imports: [RouterOutlet, RouteTabShell],
  providers: [provideTranslocoScope('common')],
  template: `
    <app-route-tab-shell
      [heading]="nav().contentAdministration"
      [seoTitle]="nav().contentAdministration"
      [canonicalUrl]="pageUrl"
      [tabs]="tabs()"
    >
      <router-outlet />
    </app-route-tab-shell>
  `,
})
export class AdminContentShell {
  protected readonly nav = createCommonNavI18n();
  protected readonly pageUrl = buildSiteUrl('/admin/content');
  protected readonly tabs = computed<readonly RouteTabDefinition[]>(() => [
    {
      id: 'content',
      label: this.nav().contentManagement,
      icon: 'pi pi-file-edit',
      path: '/admin/content',
    },
    {
      id: 'offers',
      label: this.nav().offersManagement,
      icon: 'pi pi-tags',
      path: '/admin/content/offers',
    },
    {
      id: 'events',
      label: this.nav().eventsManagement,
      icon: 'pi pi-calendar',
      path: '/admin/content/events',
    },
  ]);
}
