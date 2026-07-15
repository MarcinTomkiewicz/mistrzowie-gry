import { computed } from '@angular/core';

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

  return {
    aria,
    slidesCopy,
  };
}
