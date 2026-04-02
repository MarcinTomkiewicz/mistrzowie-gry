import { computed } from '@angular/core';

import {
  HeroCarouselAria,
  HeroSlideCopy,
} from '../../../../core/types/i18n/home';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import { dictToSortedArray } from '../../../../core/utils/dict-to-sorted-array';

function toSortedById<T>(dict: unknown): T[] {
  return dictToSortedArray<T>(dict as never, (x) =>
    Number((x as { id?: number })?.id ?? 0),
  );
}

export function createHeroCarouselI18n() {
  const { aria, slidesDict } = createScopedSectionsI18n<{
    aria: HeroCarouselAria;
    slidesDict: Record<string, HeroSlideCopy>;
  }>('home', {
    aria: 'heroCarousel.aria',
    slidesDict: 'heroCarousel.slides',
  });

  const slidesCopy = computed<HeroSlideCopy[]>(() =>
    toSortedById<HeroSlideCopy>(slidesDict()).map((x) => ({
      id: Number((x as { id?: number })?.id ?? 0),
      heading: String((x as { heading?: string })?.heading ?? ''),
      text: String((x as { text?: string })?.text ?? ''),
      ctaLabel: String((x as { ctaLabel?: string })?.ctaLabel ?? ''),
    })),
  );

  return {
    aria,
    slidesCopy,
  };
}
