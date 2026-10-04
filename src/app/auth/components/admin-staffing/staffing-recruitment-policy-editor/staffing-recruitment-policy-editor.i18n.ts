import { translateSignal } from '@jsverse/transloco';
import { createCommonActionsI18n, createCommonErrorsI18n, createCommonFormI18n, createCommonStatusI18n } from '../../../../core/translations/common.i18n';
import { createScopedObjectI18n } from '../../../../core/translations/scoped.i18n';
import { AdminStaffingRecruitmentPolicyCopy } from '../../../../core/types/i18n/admin-staffing';

export function createStaffingRecruitmentPolicyEditorI18n() {
  return {
    copy: createScopedObjectI18n<AdminStaffingRecruitmentPolicyCopy>('adminStaffing', 'recruitmentPolicy'),
    title: translateSignal('shell.tabs.recruitmentPolicy', {}, { scope: 'adminStaffing' }),
    commonActions: createCommonActionsI18n(),
    commonErrors: createCommonErrorsI18n(),
    commonForm: createCommonFormI18n(),
    commonStatus: createCommonStatusI18n(),
  };
}
