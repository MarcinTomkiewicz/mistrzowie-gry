import {
  createCommonActionsI18n,
  createCommonCtaI18n,
  createCommonErrorsI18n,
  createCommonLabelsI18n,
  createCommonNavI18n,
  createCommonStatusI18n,
  createCommonValuesI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import { createStaffingI18n, GM_STAFFING_SCOPE } from '../../../core/translations/staffing.i18n';
import type { GmStaffingHubCopy } from '../../../core/types/i18n/gm-staffing';

export function createGmStaffingHubI18n() {
  const { realizationStatuses, realizationTypes, candidateStates } = createStaffingI18n();

  return {
    ...createScopedSectionsI18n<GmStaffingHubCopy>(GM_STAFFING_SCOPE, {
      page: 'page',
      sections: 'sections',
      card: 'card',
    }),
    realizationStatuses,
    realizationTypes,
    candidateStates,
    commonActions: createCommonActionsI18n(),
    commonCta: createCommonCtaI18n(),
    commonErrors: createCommonErrorsI18n(),
    commonLabels: createCommonLabelsI18n(),
    commonNav: createCommonNavI18n(),
    commonStatus: createCommonStatusI18n(),
    commonValues: createCommonValuesI18n(),
  };
}
