import { computed } from '@angular/core';

import {
  HeroCarouselAria,
  HeroSlideCopy,
} from '../../../../core/types/i18n/home';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import { dictToSortedArray } from '../../../../core/utils/dict-to-sorted-array';

export function createHeroCarouselI18n() {
  const { aria, slidesDict } = createScopedSectionsI18n<{
    aria: HeroCarouselAria;
    slidesDict: Record<string, HeroSlideCopy>;
  }>('home', {
    aria: 'heroCarousel.aria',
    slidesDict: 'heroCarousel.slides',
  });

  const slidesCopy = computed<HeroSlideCopy[]>(() =>
    dictToSortedArray<HeroSlideCopy>(
      slidesDict() as never,
      (item) => Number((item as { id?: number })?.id ?? 0),
    ).map((item) => ({
      id: Number((item as { id?: number })?.id ?? 0),
      heading: String((item as { heading?: string })?.heading ?? ''),
      text: String((item as { text?: string })?.text ?? ''),
      ctaLabel: String((item as { ctaLabel?: string })?.ctaLabel ?? ''),
    })),
  );

  return {
    aria,
    slidesCopy,
  };
}
