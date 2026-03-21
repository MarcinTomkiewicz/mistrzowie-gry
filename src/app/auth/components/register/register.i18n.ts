import { translateObjectSignal, translateSignal } from '@jsverse/transloco';

import { pickTranslations } from '../../../core/utils/pick-translation';

export function createRegisterI18n() {
  const seoTitle = translateSignal('register.seoTitle', {}, { scope: 'auth' });
  const seoDescription = translateSignal('register.seoDescription', {}, {
    scope: 'auth',
  });

  const heroDict = translateObjectSignal('register.hero', {}, {
    scope: 'auth',
  });

  const hero = pickTranslations(heroDict, ['title', 'subtitle'] as const);

  return {
    seoTitle,
    seoDescription,
    hero,
  };
}