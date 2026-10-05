import { Component, computed, input, model } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';

import { STAFFING_AVAILABILITY_BADGE_CLASS } from '../../../../core/configs/staffing-availability.config';
import type {
  AdminStaffingAvailability,
  AdminStaffingGmAvailability,
} from '../../../../core/interfaces/admin-staffing-availability';
import { formatDateLabel } from '../../../../core/utils/date';
import { formatTimeRangeLabel } from '../../../../core/utils/time-format';
import { getUserDisplayName } from '../../../../core/utils/user-display';
import { createStaffingRealizationBoardI18n } from './staffing-realization-board.i18n';

@Component({
  selector: 'app-staffing-realization-availability',
  imports: [ButtonModule, DialogModule, TableModule],
  templateUrl: './staffing-realization-availability.html',
})
export class StaffingRealizationAvailability {
  readonly availability = input.required<AdminStaffingAvailability>();
  readonly selectedGm = model<AdminStaffingGmAvailability | null>(null);

  protected readonly i18n = createStaffingRealizationBoardI18n();
  protected readonly badgeClass = STAFFING_AVAILABILITY_BADGE_CLASS;
  protected readonly getUserDisplayName = getUserDisplayName;
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly formatTimeRangeLabel = formatTimeRangeLabel;
  protected readonly gmRows = computed(() => {
    const statuses = this.i18n.copy().availability.statuses;
    return this.availability().gms.map((gm) => ({
      gm,
      statusLabel: statuses[gm.status],
      statusBadgeClass: STAFFING_AVAILABILITY_BADGE_CLASS[gm.status],
    }));
  });
  protected readonly slotRows = computed(() => {
    const statuses = this.i18n.copy().availability.statuses;
    return this.selectedGm()?.slots.map((slot) => ({
      slot,
      statusLabel: statuses[slot.status],
      statusBadgeClass: STAFFING_AVAILABILITY_BADGE_CLASS[slot.status],
    })) ?? [];
  });
}
