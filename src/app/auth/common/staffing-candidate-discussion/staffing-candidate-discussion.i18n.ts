import {
  createCommonActionsI18n,
  createCommonErrorsI18n,
  createCommonFormI18n,
  createCommonStatusI18n,
} from '../../../core/translations/common.i18n';
import { createScopedObjectI18n } from '../../../core/translations/scoped.i18n';
import { STAFFING_SCOPE } from '../../../core/translations/staffing.i18n';
import type { StaffingCandidateThreadCopy } from '../../../core/types/i18n/staffing';

export function createStaffingCandidateDiscussionI18n() {
  return {
    copy: createScopedObjectI18n<StaffingCandidateThreadCopy>(STAFFING_SCOPE, 'candidateThread'),
    commonActions: createCommonActionsI18n(),
    commonErrors: createCommonErrorsI18n(),
    commonForm: createCommonFormI18n(),
    commonStatus: createCommonStatusI18n(),
  };
}
