import {
  createCommonActionsI18n,
  createCommonCtaI18n,
  createCommonErrorsI18n,
  createCommonStatusI18n,
} from '../../../core/translations/common.i18n';
import { createScopedObjectI18n } from '../../../core/translations/scoped.i18n';
import { GM_STAFFING_SCOPE } from '../../../core/translations/staffing.i18n';
import type { StaffingSessionSelectorCopy } from '../../../core/types/i18n/gm-staffing';

export function createStaffingSessionSelectorI18n() {
  return {
    copy: createScopedObjectI18n<StaffingSessionSelectorCopy>(GM_STAFFING_SCOPE, 'sessionSelector'),
    commonActions: createCommonActionsI18n(),
    commonCta: createCommonCtaI18n(),
    commonErrors: createCommonErrorsI18n(),
    commonStatus: createCommonStatusI18n(),
  };
}
