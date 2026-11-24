import type { MyStaffingCandidate } from '../interfaces/my-staffing-realization';
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
import { createCommonEntityStatusesI18n, createCommonStatusPhrasesI18n } from './common.i18n';
import { createScopedSectionsI18n } from './scoped.i18n';

export const STAFFING_SCOPE = 'staffing';
export const GM_STAFFING_SCOPE = 'gmStaffing';

export function createStaffingI18n() {
  const commonEntityStatuses = createCommonEntityStatusesI18n();
  const commonStatusPhrases = createCommonStatusPhrasesI18n();
  const { realizationStatuses, candidateStates, ...sections } = createScopedSectionsI18n<{
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

  return {
    ...sections,
    commonEntityStatuses,
    realizationStatusLabel: (status: StaffingRealizationStatus): string | null =>
      status === 'completed' || status === 'archived'
        ? commonEntityStatuses()[status]?.feminine ?? null
        : realizationStatuses()[status] ?? null,
    candidateStateLabel: (state: MyStaffingCandidate['state']): string | null =>
      state === 'pending'
        ? commonStatusPhrases().awaitingDecision ?? null
        : candidateStates()[state] ?? null,
  };
}
