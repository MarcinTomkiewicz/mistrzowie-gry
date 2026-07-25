import { createCommonStatusI18n } from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  GmAvailabilityOverviewToastTranslations,
  GmAvailabilityOverviewTranslations,
} from '../../../core/types/i18n/auth';

export const GM_AVAILABILITY_OVERVIEW_SCOPE = 'gmAvailabilityOverview';

export function createGmAvailabilityOverviewI18n() {
  const { gmAvailabilityOverview, toast } = createScopedSectionsI18n<{
    gmAvailabilityOverview: GmAvailabilityOverviewTranslations;
    toast: GmAvailabilityOverviewToastTranslations;
  }>(GM_AVAILABILITY_OVERVIEW_SCOPE, {
    gmAvailabilityOverview: 'page',
    toast: 'toast',
  });
  const commonStatus = createCommonStatusI18n();

  return {
    gmAvailabilityOverview,
    toast,
    commonStatus,
  };
}
