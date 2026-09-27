import { createCommonNavI18n } from '../../../core/translations/common.i18n';
import { createScopedObjectI18n } from '../../../core/translations/scoped.i18n';
import type { EditProfileSeoTranslations } from '../../../core/types/i18n/auth';

export function createEditProfileI18n() {
  return {
    seo: createScopedObjectI18n<EditProfileSeoTranslations>('auth', 'editProfile.seo'),
    commonNav: createCommonNavI18n(),
  };
}
