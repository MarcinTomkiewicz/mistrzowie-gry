import {
  createCommonActionsI18n,
  createCommonAppRolesI18n,
  createCommonErrorsI18n,
  createCommonLabelsI18n,
  createCommonStatusI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import { ISessionReservationI18nSections } from '../../../core/interfaces/i-session-reservation-i18n';

export function createSessionReservationI18n() {
  const sections = createScopedSectionsI18n<ISessionReservationI18nSections>(
    'sessionReservation',
    {
      seo: 'seo',
      hero: 'hero',
      sections: 'sections',
      labels: 'labels',
      states: 'states',
      errors: 'errors',
    },
  );

  const commonActions = createCommonActionsI18n();
  const commonAppRoles = createCommonAppRolesI18n();
  const commonErrors = createCommonErrorsI18n();
  const commonLabels = createCommonLabelsI18n();
  const commonStatus = createCommonStatusI18n();

  return {
    ...sections,
    commonActions,
    commonAppRoles,
    commonErrors,
    commonLabels,
    commonStatus,
  };
}
