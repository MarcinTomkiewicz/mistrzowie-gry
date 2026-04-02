import { computed } from '@angular/core';

import { createScopedObjectI18n } from '../../../core/translations/scoped.i18n';
import {
  RegisterHeroTranslations,
  RegisterRootTranslations,
  RegisterSeoTranslations,
} from '../../../core/types/i18n/auth';

export function createRegisterI18n() {
  const register = createScopedObjectI18n<RegisterRootTranslations>(
    'auth',
    'register',
  );

  const seo = computed<RegisterSeoTranslations>(() => ({
    title: register().seoTitle,
    description: register().seoDescription,
  }));

  const hero = computed<RegisterHeroTranslations>(() => register().hero);

  return {
    seo,
    hero,
  };
}
