import { computed } from '@angular/core';
import { translateSignal } from '@jsverse/transloco';

import type { StaffingRealizationStatus } from '../types/staffing-realization';
import type {
  StaffingLabelsTranslations,
  StaffingRealizationStatusTranslations,
  StaffingRealizationTypeTranslations,
  StaffingReimbursementModeTranslations,
  StaffingTransportModeTranslations,
  StaffingWorkTimeScopeTranslations,
} from '../types/i18n/staffing';
import { createScopedSectionsI18n } from './scoped.i18n';

export const STAFFING_SCOPE = 'staffing';

export function createStaffingSaveLabel(
  getStatus: () => StaffingRealizationStatus | undefined,
  getSaveLabel: () => string,
) {
  const saveDraft = translateSignal('schedule.actions.saveDraft', {}, { scope: 'adminStaffing' });
  return computed(() => getStatus() === 'draft' ? saveDraft() : getSaveLabel());
}

export function createStaffingI18n() {
  return createScopedSectionsI18n<{
    realizationStatuses: StaffingRealizationStatusTranslations;
    realizationTypes: StaffingRealizationTypeTranslations;
    staffingLabels: StaffingLabelsTranslations;
    transportModes: StaffingTransportModeTranslations;
    reimbursementModes: StaffingReimbursementModeTranslations;
    workTimeScopes: StaffingWorkTimeScopeTranslations;
  }>(STAFFING_SCOPE, {
    realizationStatuses: 'realizationStatuses',
    realizationTypes: 'realizationTypes',
    staffingLabels: 'labels',
    transportModes: 'transportModes',
    reimbursementModes: 'reimbursementModes',
    workTimeScopes: 'workTimeScopes',
  });
}
