import {
  createCommonActionsI18n,
  createCommonCtaI18n,
  createCommonErrorsI18n,
  createCommonFormI18n,
  createCommonLabelsI18n,
  createCommonStatusI18n,
  createCommonValuesI18n,
} from '../../../core/translations/common.i18n';
import { createScopedObjectI18n, createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import { createStaffingI18n, GM_STAFFING_SCOPE } from '../../../core/translations/staffing.i18n';
import type {
  AdminStaffingEditorCopy,
  AdminStaffingRecruitmentPolicyCopy,
  AdminStaffingScheduleEditorCopy,
  AdminStaffingTravelTermsEditorCopy,
} from '../../../core/types/i18n/admin-staffing';
import type { GmStaffingDetailCopy } from '../../../core/types/i18n/gm-staffing';

export function createGmStaffingRealizationDetailI18n() {
  const { realizationStatusLabel, realizationTypes, candidateStateLabel, staffingLabels, commonEntityStatuses } = createStaffingI18n();

  return {
    copy: createScopedObjectI18n<GmStaffingDetailCopy>(GM_STAFFING_SCOPE, 'detail'),
    ...createScopedSectionsI18n<{
      coreFields: AdminStaffingEditorCopy['fields'];
      basicSection: AdminStaffingEditorCopy['sections']['basic'];
      schedule: Pick<AdminStaffingScheduleEditorCopy, 'section' | 'emptySlots'>;
      recruitmentPolicy: Pick<
        AdminStaffingRecruitmentPolicyCopy,
        'fields' | 'stationaryScopes' | 'sessionModes' | 'travelHint'
      >;
    }>('adminStaffing', {
      coreFields: 'editor.fields',
      basicSection: 'editor.sections.basic',
      schedule: 'schedule',
      recruitmentPolicy: 'recruitmentPolicy',
    }),
    realizationStatusLabel,
    realizationTypes,
    candidateStateLabel,
    staffingLabels,
    commonActions: createCommonActionsI18n(),
    commonCta: createCommonCtaI18n(),
    commonEntityStatuses,
    commonErrors: createCommonErrorsI18n(),
    commonForm: createCommonFormI18n(),
    commonLabels: createCommonLabelsI18n(),
    commonStatus: createCommonStatusI18n(),
    commonValues: createCommonValuesI18n(),
  };
}

export function createGmStaffingTravelTermsI18n() {
  const { transportModes, reimbursementModes, workTimeScopes } = createStaffingI18n();

  return {
    ...createScopedSectionsI18n<{
      fields: AdminStaffingTravelTermsEditorCopy['fields'];
      sections: AdminStaffingTravelTermsEditorCopy['sections'];
    }>('adminStaffing', {
      fields: 'travelTerms.fields',
      sections: 'travelTerms.sections',
    }),
    transportModes,
    reimbursementModes,
    workTimeScopes,
    commonValues: createCommonValuesI18n(),
  };
}
