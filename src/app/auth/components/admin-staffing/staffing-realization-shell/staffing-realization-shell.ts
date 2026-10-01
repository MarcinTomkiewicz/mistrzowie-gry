import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';

import { buildSiteUrl } from '../../../../core/config/site';
import type { RouteTabDefinition } from '../../../../core/types/route-tab';
import { RouteTabShell } from '../../../common/route-tab-shell/route-tab-shell';
import { createStaffingRealizationShellI18n } from './staffing-realization-shell.i18n';

@Component({
  selector: 'app-staffing-realization-shell',
  standalone: true,
  imports: [RouterOutlet, RouteTabShell],
  templateUrl: './staffing-realization-shell.html',
  providers: [provideTranslocoScope('adminStaffing')],
})
export class StaffingRealizationShell {
  private readonly realizationId =
    inject(ActivatedRoute).snapshot.paramMap.get('realizationId') ?? '';

  protected readonly i18n = createStaffingRealizationShellI18n();
  protected readonly pageUrl = buildSiteUrl(
    `/admin/staffing/${this.realizationId}`,
  );
  protected readonly tabs = computed<readonly RouteTabDefinition[]>(() => {
    const labels = this.i18n.shell().tabs;
    const realizationPath = `/admin/staffing/${this.realizationId}`;

    return [
      {
        id: 'core',
        label: labels.core,
        icon: 'pi pi-file-edit',
        path: `${realizationPath}/edit`,
      },
      {
        id: 'schedule',
        label: labels.schedule,
        icon: 'pi pi-calendar',
        path: `${realizationPath}/schedule`,
      },
    ];
  });
}
