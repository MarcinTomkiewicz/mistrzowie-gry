import { computed } from '@angular/core';

import {
  createCommonCtaI18n,
  createCommonNavI18n,
} from '../../../../core/translations/common.i18n';
import {
  HeroCarouselAria,
  HeroSlideCopy,
} from '../../../../core/types/i18n/home';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import { recordValuesSortedBy } from '../../../../core/utils/record-values';

export function createHeroCarouselI18n() {
  const { aria, slidesDict } = createScopedSectionsI18n<{
    aria: HeroCarouselAria;
    slidesDict: Record<string, HeroSlideCopy>;
  }>('home', {
    aria: 'heroCarousel.aria',
    slidesDict: 'heroCarousel.slides',
  });

  const slidesCopy = computed<HeroSlideCopy[]>(() =>
    recordValuesSortedBy(slidesDict(), (item) => item.id),
  );
  const commonCta = createCommonCtaI18n();
  const commonNav = createCommonNavI18n();

  return {
    aria,
    slidesCopy,
    commonCta,
    commonNav,
  };
}
