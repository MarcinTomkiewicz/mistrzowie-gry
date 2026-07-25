import { createCommonStatusI18n } from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  WorkLogOverviewActionsTranslations,
  WorkLogOverviewFormTranslations,
  WorkLogOverviewToastTranslations,
  WorkLogOverviewTranslations,
} from '../../../core/types/i18n/auth';

export const WORK_LOG_OVERVIEW_SCOPE = 'workLogOverview';

export function createWorkLogOverviewI18n() {
  const { workLogOverview, actions, form, toast } = createScopedSectionsI18n<{
    workLogOverview: WorkLogOverviewTranslations;
    actions: WorkLogOverviewActionsTranslations;
    form: WorkLogOverviewFormTranslations;
    toast: WorkLogOverviewToastTranslations;
  }>(WORK_LOG_OVERVIEW_SCOPE, {
    workLogOverview: 'page',
    actions: 'actions',
    form: 'form',
    toast: 'toast',
  });
  const commonStatus = createCommonStatusI18n();

  return {
    workLogOverview,
    actions,
    form,
    toast,
    commonStatus,
  };
}
