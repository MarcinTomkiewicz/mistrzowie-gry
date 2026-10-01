import {
  createCommonActionsI18n,
  createCommonErrorsI18n,
  createCommonFormI18n,
  createCommonLabelsI18n,
  createCommonStatusI18n,
} from '../../../../core/translations/common.i18n';
import { createScopedObjectI18n } from '../../../../core/translations/scoped.i18n';
import { createStaffingI18n } from '../../../../core/translations/staffing.i18n';
import { AdminStaffingScheduleEditorCopy } from '../../../../core/types/i18n/admin-staffing';

export function createStaffingRealizationScheduleEditorI18n() {
  return {
    schedule: createScopedObjectI18n<AdminStaffingScheduleEditorCopy>(
      'adminStaffing',
      'schedule',
    ),
    ...createStaffingI18n(),
    commonActions: createCommonActionsI18n(),
    commonErrors: createCommonErrorsI18n(),
    commonForm: createCommonFormI18n(),
    commonLabels: createCommonLabelsI18n(),
    commonStatus: createCommonStatusI18n(),
  };
}
