import { computed } from '@angular/core';
import { translateSignal } from '@jsverse/transloco';

import type { StaffingRealizationStatus } from '../../../core/types/staffing-realization';

export function createStaffingSaveLabel(
  getStatus: () => StaffingRealizationStatus | undefined,
  getSaveLabel: () => string,
) {
  const saveDraft = translateSignal('schedule.actions.saveDraft', {}, { scope: 'adminStaffing' });
  return computed(() => getStatus() === 'draft' ? saveDraft() : getSaveLabel());
}
