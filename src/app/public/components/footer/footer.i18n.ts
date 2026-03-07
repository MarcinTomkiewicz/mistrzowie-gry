import { computed } from '@angular/core';
import { translateObjectSignal } from '@jsverse/transloco';
import { pickTranslations } from '../../../core/utils/pick-translation';

export function createFooterI18n() {
  const dict = translateObjectSignal('footer', {}, { scope: 'footer' });

  const brand = computed(() =>
    pickTranslations(dict, [
      'brandAlt',
      'description',
    ] as const)(),
  );

  const sections = computed(() =>
    pickTranslations(dict, [
      'shortcutTitle',
      'contactTitle',
      'socialAriaLabel',
      'legalAriaLabel',
      'copyrightSuffix',
    ] as const)(),
  );

  const contact = computed(() =>
    pickTranslations(dict, [
      'phoneLabel',
      'phoneValue',
      'phoneHref',
      'emailLabel',
      'emailValue',
      'emailHref',
    ] as const)(),
  );

  return {
    brand,
    sections,
    contact,
  };
}