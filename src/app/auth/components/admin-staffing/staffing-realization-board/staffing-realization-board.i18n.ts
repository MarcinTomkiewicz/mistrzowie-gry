import { translateSignal } from '@jsverse/transloco';

import {
  createCommonActionsI18n,
  createCommonAppRolesI18n,
  createCommonErrorsI18n,
  createCommonFormI18n,
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
import type { StaffingAvailabilityStatus } from '../../../../core/types/staffing-realization';

export function createStaffingRealizationBoardI18n() {
  const staffing = createStaffingI18n();
  const sections = createScopedSectionsI18n<{
    copy: AdminStaffingBoardCopy;
    summary: AdminStaffingRealizationListCopy['summary'];
    scopes: AdminStaffingRecruitmentPolicyCopy['stationaryScopes'];
  }>('adminStaffing', {
    copy: 'board',
    summary: 'list.summary',
    scopes: 'recruitmentPolicy.stationaryScopes',
  });

  return {
    ...sections,
    availabilityStatusLabel: (status: StaffingAvailabilityStatus): string | null =>
      status === 'available'
        ? staffing.commonEntityStatuses().available?.masculine ?? null
        : sections.copy().availability?.statuses[status] ?? null,
    ...createScopedSectionsI18n<Pick<GmStaffingDetailCopy,
      'candidateOrigins' | 'candidateDecisions' | 'participation' | 'participationEndReasons'
    >>('gmStaffing', {
      candidateOrigins: 'detail.candidateOrigins',
      candidateDecisions: 'detail.candidateDecisions',
      participation: 'detail.participation',
      participationEndReasons: 'detail.participationEndReasons',
    }),
    ...staffing,
    commonAppRoles: createCommonAppRolesI18n(),
    summaryHint: translateSignal('list.page.summaryHint', {}, { scope: 'adminStaffing' }),
    commonActions: createCommonActionsI18n(),
    commonErrors: createCommonErrorsI18n(),
    commonForm: createCommonFormI18n(),
    commonLabels: createCommonLabelsI18n(),
    commonStatus: createCommonStatusI18n(),
    commonTable: createCommonTableI18n(),
    commonValues: createCommonValuesI18n(),
  };
}
