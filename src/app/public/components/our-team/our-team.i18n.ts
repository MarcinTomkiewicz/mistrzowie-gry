import {
  OurTeamCardTranslations,
  OurTeamPageTranslations,
  OurTeamSeoTranslations,
} from '../../../core/types/i18n/our-team';
import {
  createCommonEmptyI18n,
  createCommonAppRolesI18n,
  createCommonErrorsI18n,
  createCommonLabelsI18n,
  createCommonSeoI18n,
  createCommonStatusI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';

export function createOurTeamI18n() {
  const { page, seo, card } = createScopedSectionsI18n<{
    page: OurTeamPageTranslations;
    seo: OurTeamSeoTranslations;
    card: OurTeamCardTranslations;
  }>('ourTeam', {
    page: 'page',
    seo: 'seo',
    card: 'card',
  });
  const commonEmpty = createCommonEmptyI18n();
  const commonErrors = createCommonErrorsI18n();
  const commonStatus = createCommonStatusI18n();
  const commonSeo = createCommonSeoI18n();
  const commonLabels = createCommonLabelsI18n();
  const commonAppRoles = createCommonAppRolesI18n();

  return {
    page,
    seo,
    card,
    commonEmpty,
    commonErrors,
    commonStatus,
    commonSeo,
    commonLabels,
    commonAppRoles,
    imageAltLabel: (displayName: string) =>
      [card().imageAltPrefix, displayName].filter(Boolean).join(' ').trim(),
  };
}
