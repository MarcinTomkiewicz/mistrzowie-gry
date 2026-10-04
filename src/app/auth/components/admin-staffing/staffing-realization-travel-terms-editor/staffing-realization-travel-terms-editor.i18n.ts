import { translateSignal } from '@jsverse/transloco';

import {
  createCommonActionsI18n,
  createCommonErrorsI18n,
  createCommonFormI18n,
  createCommonStatusI18n,
} from '../../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import { createStaffingI18n } from '../../../../core/translations/staffing.i18n';
import { AdminStaffingTravelTermsEditorCopy } from '../../../../core/types/i18n/admin-staffing';

export function createStaffingRealizationTravelTermsEditorI18n() {
  return {
    ...createScopedSectionsI18n<{
      page: AdminStaffingTravelTermsEditorCopy['page'];
      sections: AdminStaffingTravelTermsEditorCopy['sections'];
      fields: AdminStaffingTravelTermsEditorCopy['fields'];
      validation: AdminStaffingTravelTermsEditorCopy['validation'];
      toast: AdminStaffingTravelTermsEditorCopy['toast'];
    }>('adminStaffing', {
      page: 'travelTerms.page',
      sections: 'travelTerms.sections',
      fields: 'travelTerms.fields',
      validation: 'travelTerms.validation',
      toast: 'travelTerms.toast',
    }),
    title: translateSignal('shell.tabs.travelTerms', {}, { scope: 'adminStaffing' }),
    ...createStaffingI18n(),
    commonActions: createCommonActionsI18n(),
    commonErrors: createCommonErrorsI18n(),
    commonForm: createCommonFormI18n(),
    commonStatus: createCommonStatusI18n(),
  };
}
