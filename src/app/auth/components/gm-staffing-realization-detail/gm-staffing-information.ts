import { Component, computed, inject } from '@angular/core';

import { STATUS_BADGE_CLASS } from '../../../core/configs/badge-class.config';
import { GmStaffingRealizationFacade } from '../../../core/facades/staffing/gm-staffing-realization-facade';
import { formatDateLabel } from '../../../core/utils/date';
import { formatTimeRangeLabel } from '../../../core/utils/time-format';
import { createGmStaffingRealizationDetailI18n } from './gm-staffing-realization-detail.i18n';

@Component({
  selector: 'app-gm-staffing-information',
  templateUrl: './gm-staffing-information.html',
})
export class GmStaffingInformation {
  protected readonly detail = inject(GmStaffingRealizationFacade).detail;
  protected readonly i18n = createGmStaffingRealizationDetailI18n();
  protected readonly statusBadgeClass = STATUS_BADGE_CLASS;
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly formatTimeRangeLabel = formatTimeRangeLabel;
  protected readonly dates = computed(() => {
    const days = this.detail()?.days;
    if (!days?.length) return null;
    const dates = days.map(day => day.date).sort();
    const start = dates[0];
    const end = dates[dates.length - 1];
    return start === end ? formatDateLabel(start) : `${formatDateLabel(start)} - ${formatDateLabel(end)}`;
  });
}
