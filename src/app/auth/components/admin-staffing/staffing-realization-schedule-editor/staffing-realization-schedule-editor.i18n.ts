import { translateSignal } from '@jsverse/transloco';

import {
  createCommonActionsI18n,
  createCommonErrorsI18n,
  createCommonFormI18n,
  createCommonLabelsI18n,
  createCommonStatusI18n,
} from '../../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import { createStaffingI18n } from '../../../../core/translations/staffing.i18n';
import { AdminStaffingScheduleEditorCopy } from '../../../../core/types/i18n/admin-staffing';

export function createStaffingRealizationScheduleEditorI18n() {
  return {
    ...createScopedSectionsI18n<{
      page: AdminStaffingScheduleEditorCopy['page'];
      section: AdminStaffingScheduleEditorCopy['section'];
      fields: AdminStaffingScheduleEditorCopy['fields'];
      actions: AdminStaffingScheduleEditorCopy['actions'];
      summary: AdminStaffingScheduleEditorCopy['summary'];
      validation: AdminStaffingScheduleEditorCopy['validation'];
      toast: AdminStaffingScheduleEditorCopy['toast'];
    }>('adminStaffing', {
      page: 'schedule.page',
      section: 'schedule.section',
      fields: 'schedule.fields',
      actions: 'schedule.actions',
      summary: 'schedule.summary',
      validation: 'schedule.validation',
      toast: 'schedule.toast',
    }),
    emptySlots: translateSignal('schedule.emptySlots', {}, { scope: 'adminStaffing' }),
    ...createStaffingI18n(),
    commonActions: createCommonActionsI18n(),
    commonErrors: createCommonErrorsI18n(),
    commonForm: createCommonFormI18n(),
    commonLabels: createCommonLabelsI18n(),
    commonStatus: createCommonStatusI18n(),
  };
}
