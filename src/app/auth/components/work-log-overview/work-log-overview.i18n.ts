import {
  createCommonLabelsI18n,
  createCommonStatusI18n,
  createCommonValuesI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  WorkLogOverviewActionsTranslations,
  WorkLogOverviewToastTranslations,
  WorkLogOverviewTranslations,
} from '../../../core/types/i18n/auth';

export const WORK_LOG_OVERVIEW_SCOPE = 'workLogOverview';

export function createWorkLogOverviewI18n() {
  const { workLogOverview, actions, toast } = createScopedSectionsI18n<{
    workLogOverview: WorkLogOverviewTranslations;
    actions: WorkLogOverviewActionsTranslations;
    toast: WorkLogOverviewToastTranslations;
  }>(WORK_LOG_OVERVIEW_SCOPE, {
    workLogOverview: 'page',
    actions: 'actions',
    toast: 'toast',
  });
  const commonStatus = createCommonStatusI18n();

  return {
    workLogOverview,
    actions,
    toast,
    commonStatus,
    commonLabels: createCommonLabelsI18n(),
    commonValues: createCommonValuesI18n(),
  };
}
