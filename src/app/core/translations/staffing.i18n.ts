import { computed } from '@angular/core';
import { translateSignal } from '@jsverse/transloco';

import type { StaffingRealizationStatus } from '../types/staffing-realization';
import type {
  StaffingCandidateStateTranslations,
  StaffingLabelsTranslations,
  StaffingRealizationStatusTranslations,
  StaffingRealizationTypeTranslations,
  StaffingReimbursementModeTranslations,
  StaffingTransportModeTranslations,
  StaffingWorkTimeScopeTranslations,
} from '../types/i18n/staffing';
import { createScopedSectionsI18n } from './scoped.i18n';

export const STAFFING_SCOPE = 'staffing';
export const GM_STAFFING_SCOPE = 'gmStaffing';

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
    candidateStates: StaffingCandidateStateTranslations;
    staffingLabels: StaffingLabelsTranslations;
    transportModes: StaffingTransportModeTranslations;
    reimbursementModes: StaffingReimbursementModeTranslations;
    workTimeScopes: StaffingWorkTimeScopeTranslations;
  }>(STAFFING_SCOPE, {
    realizationStatuses: 'realizationStatuses',
    realizationTypes: 'realizationTypes',
    candidateStates: 'candidateStates',
    staffingLabels: 'labels',
    transportModes: 'transportModes',
    reimbursementModes: 'reimbursementModes',
    workTimeScopes: 'workTimeScopes',
  });
}
