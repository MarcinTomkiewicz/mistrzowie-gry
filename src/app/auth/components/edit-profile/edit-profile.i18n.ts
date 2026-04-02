import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  EditProfileHeroTranslations,
  EditProfileSeoTranslations,
  EditProfileTabsTranslations,
} from '../../../core/types/i18n/auth';

export function createEditProfileI18n() {
  const { seo, hero, tabs } = createScopedSectionsI18n<{
    seo: EditProfileSeoTranslations;
    hero: EditProfileHeroTranslations;
    tabs: EditProfileTabsTranslations;
  }>('auth', {
    seo: 'editProfile.seo',
    hero: 'editProfile.hero',
    tabs: 'editProfile.tabs',
  });

  return {
    seo,
    hero,
    tabs,
  };
}
