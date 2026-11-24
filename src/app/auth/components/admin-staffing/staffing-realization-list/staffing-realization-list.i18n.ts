import { translateSignal } from '@jsverse/transloco';

import {
  createCommonActionsI18n,
  createCommonErrorsI18n,
  createCommonLabelsI18n,
  createCommonStatusI18n,
  createCommonTableI18n,
  createCommonValuesI18n,
} from '../../../../core/translations/common.i18n';
import { createScopedObjectI18n } from '../../../../core/translations/scoped.i18n';
import { createStaffingI18n } from '../../../../core/translations/staffing.i18n';
import { AdminStaffingRealizationListCopy } from '../../../../core/types/i18n/admin-staffing';

export function createStaffingRealizationListI18n() {
  const { realizationStatusLabel, realizationTypes, commonEntityStatuses } = createStaffingI18n();

  return {
    copy: createScopedObjectI18n<AdminStaffingRealizationListCopy>('adminStaffing', 'list'),
    createLabel: translateSignal('editor.page.createTitle', {}, { scope: 'adminStaffing' }),
    realizationStatusLabel,
    realizationTypes,
    commonActions: createCommonActionsI18n(),
    commonEntityStatuses,
    commonErrors: createCommonErrorsI18n(),
    commonLabels: createCommonLabelsI18n(),
    commonStatus: createCommonStatusI18n(),
    commonTable: createCommonTableI18n(),
    commonValues: createCommonValuesI18n(),
  };
}
