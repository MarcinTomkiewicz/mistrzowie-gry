import { computed } from '@angular/core';
import { translateObjectSignal } from '@jsverse/transloco';

import { dictToSortedArray } from '../../../../core/utils/dict-to-sorted-array';
import { pickTranslations } from '../../../../core/utils/pick-translation';
import { IHeroSlide } from '../../../../core/interfaces/home/i-hero-slide';

export type HeroSlideCopy = {
  id: number;
  heading: string;
  text: string;
  ctaLabel: string;
};

export type HeroCarouselAria = {
  sectionLabel: string;
  prev: string;
  next: string;
  dots: string;
  goToPrefix: string;
};


export type HeroSlideTech = {
  id: number;
  ctaPath: string;
  imageSrc: string;
  imageAlt: string;
};

export type UiHeroSlide = IHeroSlide & { id: number };

function toSortedById<T>(dict: unknown): T[] {
  return dictToSortedArray<T>(dict as never, (x) =>
    Number((x as { id?: number })?.id ?? 0),
  );
}

export function createHeroCarouselI18n() {
  const ariaDict = translateObjectSignal(
    'heroCarousel.aria',
    {},
    { scope: 'home' },
  );

  const slidesDict = translateObjectSignal(
    'heroCarousel.slides',
    {},
    { scope: 'home' },
  );

  const rawAria = pickTranslations(ariaDict, [
    'sectionLabel',
    'prev',
    'next',
    'dots',
    'goToSlidePrefix',
  ] as const);

  const aria = computed<HeroCarouselAria>(() => {
    const a = rawAria();

    return {
      sectionLabel: a.sectionLabel || 'Wprowadzenie do usług RPG',
      prev: a.prev || 'Poprzedni slajd',
      next: a.next || 'Następny slajd',
      dots: a.dots || 'Wybór slajdu',
      goToPrefix: a.goToSlidePrefix || 'Przejdź do slajdu',
    };
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