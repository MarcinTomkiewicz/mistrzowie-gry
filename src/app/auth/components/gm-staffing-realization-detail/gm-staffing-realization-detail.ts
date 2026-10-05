import { Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterOutlet } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { catchError, distinctUntilChanged, EMPTY, map, startWith, Subject, switchMap } from 'rxjs';

import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { buildSiteUrl } from '../../../core/config/site';
import { GM_STAFFING_HUB_ROUTE } from '../../../core/configs/staffing-realization.config';
import { GmStaffingRealizationFacade } from '../../../core/facades/staffing/gm-staffing-realization-facade';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { GM_STAFFING_SCOPE, STAFFING_SCOPE } from '../../../core/translations/staffing.i18n';
import type { RouteTabDefinition } from '../../../core/types/route-tab';
import { RpcError } from '../../../core/types/rpc-error';
import { RouteTabShell } from '../../common/route-tab-shell/route-tab-shell';
import { createGmStaffingRealizationDetailI18n } from './gm-staffing-realization-detail.i18n';

@Component({
  selector: 'app-gm-staffing-realization-detail',
  imports: [RouterLink, RouterOutlet, ButtonModule, LoadingOverlay, RouteTabShell],
  templateUrl: './gm-staffing-realization-detail.html',
  providers: [
    GmStaffingRealizationFacade,
    provideTranslocoScope(GM_STAFFING_SCOPE, STAFFING_SCOPE, 'adminStaffing', 'common'),
  ],
})
export class GmStaffingRealizationDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(UiToast);
  private readonly reload = new Subject<void>();
  private readonly realizationId = toSignal(
    this.route.paramMap.pipe(map(params => params.get('realizationId') ?? '')),
    { requireSync: true },
  );

  protected readonly facade = inject(GmStaffingRealizationFacade);
  protected readonly i18n = createGmStaffingRealizationDetailI18n();
  protected readonly hubRoute = GM_STAFFING_HUB_ROUTE;
  protected readonly realizationPath = computed(() => `${this.hubRoute}/${this.realizationId()}`);
  protected readonly pageUrl = computed(() => buildSiteUrl(this.realizationPath()));
  protected readonly isNotFound = computed(() => {
    const error = this.facade.loadError();
    return error instanceof RpcError && error.code === 'P0002';
  });
  protected readonly tabs = computed<readonly RouteTabDefinition[]>(() => {
    const labels = this.i18n.copy().tabs;
    const path = this.realizationPath();
    const tabs: RouteTabDefinition[] = [
      { id: 'information', label: labels.information, icon: 'pi pi-info-circle', path },
    ];
    if (this.facade.detail()?.type === 'travel') {
      tabs.push({ id: 'travel-terms', label: labels.travelTerms, icon: 'pi pi-bindle', path: `${path}/travel-terms` });
    }
    tabs.push({ id: 'participation', label: labels.participation, icon: 'pi pi-users', path: `${path}/participation` });
    return tabs;
  });

  constructor() {
    this.route.paramMap.pipe(
      map(params => params.get('realizationId')),
      distinctUntilChanged(),
      switchMap(id => this.reload.pipe(
        startWith(undefined),
        switchMap(() => id === null ? EMPTY : this.facade.load(id).pipe(
          catchError(() => {
            if (!this.isNotFound()) {
              this.toast.danger({
                summary: this.i18n.copy().errors.loadFailed,
                detail: this.i18n.commonErrors().generic,
              });
            }
            return EMPTY;
          }),
        )),
      )),
      takeUntilDestroyed(),
    ).subscribe();
  }

  protected retry(): void {
    this.reload.next();
  }
}
