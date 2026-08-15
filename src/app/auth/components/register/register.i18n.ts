import { createScopedObjectI18n } from '../../../core/translations/scoped.i18n';
import {
  ProfileFormActionsTranslations,
  ProfileFormTitleTranslations,
  RegisterRootTranslations,
} from '../../../core/types/i18n/auth';

export function createRegisterI18n() {
  const register = createScopedObjectI18n<RegisterRootTranslations>(
    'auth',
    'register',
  );
  const profileTitle = createScopedObjectI18n<ProfileFormTitleTranslations>(
    'auth',
    'profileForm.title',
  );
  const profileActions = createScopedObjectI18n<ProfileFormActionsTranslations>(
    'auth',
    'profileForm.actions',
  );

  return {
    register,
    profileTitle,
    profileActions,
  };
}
