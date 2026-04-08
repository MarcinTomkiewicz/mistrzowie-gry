import { createCommonStatusI18n } from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  GmAvailabilityOverviewToastTranslations,
  GmAvailabilityOverviewTranslations,
} from '../../../core/types/i18n/auth';

export function createGmAvailabilityOverviewI18n() {
  const { gmAvailabilityOverview, toast } = createScopedSectionsI18n<{
    gmAvailabilityOverview: GmAvailabilityOverviewTranslations;
    toast: GmAvailabilityOverviewToastTranslations;
  }>('auth', {
    gmAvailabilityOverview: 'gmAvailabilityOverview',
    toast: 'gmAvailabilityOverview.toast',
  });
  const commonStatus = createCommonStatusI18n();

  return {
    gmAvailabilityOverview,
    toast,
    commonStatus,
  };
}
