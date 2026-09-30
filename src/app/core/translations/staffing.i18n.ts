import type {
  StaffingRealizationStatusTranslations,
  StaffingRealizationTypeTranslations,
} from '../types/i18n/staffing';
import { createScopedSectionsI18n } from './scoped.i18n';

export const STAFFING_SCOPE = 'staffing';

export function createStaffingI18n() {
  return createScopedSectionsI18n<{
    realizationStatuses: StaffingRealizationStatusTranslations;
    realizationTypes: StaffingRealizationTypeTranslations;
  }>(STAFFING_SCOPE, {
    realizationStatuses: 'realizationStatuses',
    realizationTypes: 'realizationTypes',
  });
}
