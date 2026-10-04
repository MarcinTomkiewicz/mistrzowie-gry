import { Component, computed, DestroyRef, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { map } from 'rxjs';

import { buildSiteUrl } from '../../../../core/config/site';
import { StaffingRealizationEditorStore } from '../../../../core/stores/staffing/staffing-realization-editor-store';
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
  private readonly store = inject(StaffingRealizationEditorStore);
  private readonly realizationId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('realizationId') ?? '')),
    { requireSync: true },
  );

  protected readonly i18n = createStaffingRealizationShellI18n();
  protected readonly pageUrl = computed(() => buildSiteUrl(
    `/admin/staffing/${this.realizationId()}`,
  ));
  protected readonly tabs = computed<readonly RouteTabDefinition[]>(() => {
    const labels = this.i18n.tabLabels();
    const realizationPath = `/admin/staffing/${this.realizationId()}`;

    const tabs: RouteTabDefinition[] = [
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

    if (this.store.coreDraft()?.type === 'travel') {
      tabs.push({
        id: 'travel-terms',
        label: labels.travelTerms,
        icon: 'pi pi-bindle',
        path: `${realizationPath}/travel-terms`,
      });
    }

    return tabs;
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.store.reset());
  }
}
