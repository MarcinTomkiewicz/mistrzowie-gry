import { Component, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';

import { buildSiteUrl } from '../../../../core/config/site';
import type { RouteTabDefinition } from '../../../../core/types/route-tab';
import { RouteTabShell } from '../../../common/route-tab-shell/route-tab-shell';
import { createCoworkerShellI18n } from './coworker-shell.i18n';

@Component({
  selector: 'app-coworker-shell',
  standalone: true,
  imports: [RouterOutlet, RouteTabShell],
  templateUrl: './coworker-shell.html',
  providers: [provideTranslocoScope('auth', 'common')],
})
export class CoworkerShell {
  protected readonly pageUrl = buildSiteUrl('/auth/coworker');

  protected readonly i18n = createCoworkerShellI18n();

  protected readonly tabs = computed<readonly RouteTabDefinition[]>(() => {
    const labels = this.i18n.tabs();

    return [
      {
        id: 'questionnaire',
        label: labels.questionnaire,
        icon: 'pi pi-id-card',
        path: '/auth/coworker/questionnaire',
      },
      {
        id: 'private-documents',
        label: labels.privateDocuments,
        icon: 'pi pi-lock',
        path: '/auth/coworker/documents',
      },
      {
        id: 'shared-documents',
        label: labels.sharedDocuments,
        icon: 'pi pi-book',
        path: '/auth/coworker/operational-documents',
      },
    ];
  });
}
