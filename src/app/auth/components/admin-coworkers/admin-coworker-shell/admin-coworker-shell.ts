import { Component, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';

import { buildSiteUrl } from '../../../../core/config/site';
import type { RouteTabDefinition } from '../../../../core/types/route-tab';
import { RouteTabShell } from '../../../common/route-tab-shell/route-tab-shell';
import {
  ADMIN_COWORKER_SHELL_SCOPE,
  createAdminCoworkerShellI18n,
} from './admin-coworker-shell.i18n';

@Component({
  selector: 'app-admin-coworker-shell',
  standalone: true,
  imports: [RouterOutlet, RouteTabShell],
  templateUrl: './admin-coworker-shell.html',
  providers: [provideTranslocoScope(ADMIN_COWORKER_SHELL_SCOPE)],
})
export class AdminCoworkerShell {
  protected readonly pageUrl = buildSiteUrl('/admin/coworkers');
  protected readonly i18n = createAdminCoworkerShellI18n();

  protected readonly tabs = computed<readonly RouteTabDefinition[]>(() => {
    const labels = this.i18n.tabs();

    return [
      {
        id: 'private-documents',
        label: labels.privateDocuments,
        icon: 'pi pi-lock',
        path: '/admin/coworkers/private-documents',
      },
      {
        id: 'shared-documents',
        label: labels.sharedDocuments,
        icon: 'pi pi-book',
        path: '/admin/coworkers/operational-documents',
      },
    ];
  });
}
