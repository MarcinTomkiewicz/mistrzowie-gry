import { createSessionDetailsI18n } from '../../../../common/session-details/session-details.i18n';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import type { StaffingFinalPlanCopy } from '../../../../core/types/i18n/staffing-final-plan';
import type { StaffingSessionSelectorCopy } from '../../../../core/types/i18n/gm-staffing';
import { createStaffingRealizationBoardI18n } from '../staffing-realization-board/staffing-realization-board.i18n';

export function createStaffingFinalPlanEditorI18n() {
  return {
    ...createStaffingRealizationBoardI18n(),
    ...createScopedSectionsI18n<{ finalPlan: StaffingFinalPlanCopy }>('adminStaffing', { finalPlan: 'finalPlan' }),
    ...createScopedSectionsI18n<{ sessionSelector: StaffingSessionSelectorCopy }>('gmStaffing', { sessionSelector: 'sessionSelector' }),
    sessionDetails: createSessionDetailsI18n(),
  };
}
