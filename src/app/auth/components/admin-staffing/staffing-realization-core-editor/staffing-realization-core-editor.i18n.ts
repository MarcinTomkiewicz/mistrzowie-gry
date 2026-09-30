import {
  createCommonActionsI18n,
  createCommonErrorsI18n,
  createCommonFormI18n,
  createCommonLabelsI18n,
  createCommonStatusI18n,
} from '../../../../core/translations/common.i18n';
import { createScopedObjectI18n } from '../../../../core/translations/scoped.i18n';
import { createStaffingI18n } from '../../../../core/translations/staffing.i18n';
import { AdminStaffingEditorCopy } from '../../../../core/types/i18n/admin-staffing';

export function createStaffingRealizationCoreEditorI18n() {
  return {
    editor: createScopedObjectI18n<AdminStaffingEditorCopy>(
      'adminStaffing',
      'editor',
    ),
    ...createStaffingI18n(),
    commonActions: createCommonActionsI18n(),
    commonErrors: createCommonErrorsI18n(),
    commonForm: createCommonFormI18n(),
    commonLabels: createCommonLabelsI18n(),
    commonStatus: createCommonStatusI18n(),
  };
}
