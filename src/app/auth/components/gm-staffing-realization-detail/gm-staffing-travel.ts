import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';

import { GM_STAFFING_HUB_ROUTE } from '../../../core/configs/staffing-realization.config';
import { GmStaffingRealizationFacade } from '../../../core/facades/staffing/gm-staffing-realization-facade';
import { createGmStaffingRealizationDetailI18n } from './gm-staffing-realization-detail.i18n';
import { GmStaffingTravelTerms } from './gm-staffing-travel-terms';

@Component({
  selector: 'app-gm-staffing-travel',
  imports: [GmStaffingTravelTerms],
  templateUrl: './gm-staffing-travel.html',
})
export class GmStaffingTravel {
  private readonly router = inject(Router);
  protected readonly detail = inject(GmStaffingRealizationFacade).detail;
  protected readonly i18n = createGmStaffingRealizationDetailI18n();

  constructor() {
    effect(() => {
      const detail = this.detail();
      if (detail?.type === 'stationary') {
        void this.router.navigate([GM_STAFFING_HUB_ROUTE, detail.id]);
      }
    });
  }
}
