import { translateSignal } from '@jsverse/transloco';

import {
  createCommonActionsI18n,
  createCommonErrorsI18n,
  createCommonLabelsI18n,
  createCommonStatusI18n,
  createCommonTableI18n,
  createCommonValuesI18n,
} from '../../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import { createStaffingI18n } from '../../../../core/translations/staffing.i18n';
import type {
  AdminStaffingBoardCopy,
  AdminStaffingRealizationListCopy,
  AdminStaffingRecruitmentPolicyCopy,
} from '../../../../core/types/i18n/admin-staffing';
import type { GmStaffingDetailCopy } from '../../../../core/types/i18n/gm-staffing';

export function createStaffingRealizationBoardI18n() {
  return {
    ...createScopedSectionsI18n<{
      copy: AdminStaffingBoardCopy;
      summary: AdminStaffingRealizationListCopy['summary'];
      scopes: AdminStaffingRecruitmentPolicyCopy['stationaryScopes'];
    }>('adminStaffing', {
      copy: 'board',
      summary: 'list.summary',
      scopes: 'recruitmentPolicy.stationaryScopes',
    }),
    ...createScopedSectionsI18n<Pick<GmStaffingDetailCopy,
      'candidateOrigins' | 'candidateDecisions' | 'participation' | 'participationEndReasons'
    >>('gmStaffing', {
      candidateOrigins: 'detail.candidateOrigins',
      candidateDecisions: 'detail.candidateDecisions',
      participation: 'detail.participation',
      participationEndReasons: 'detail.participationEndReasons',
    }),
    ...createStaffingI18n(),
    summaryHint: translateSignal('list.page.summaryHint', {}, { scope: 'adminStaffing' }),
    commonActions: createCommonActionsI18n(),
    commonErrors: createCommonErrorsI18n(),
    commonLabels: createCommonLabelsI18n(),
    commonStatus: createCommonStatusI18n(),
    commonTable: createCommonTableI18n(),
    commonValues: createCommonValuesI18n(),
  };
}
