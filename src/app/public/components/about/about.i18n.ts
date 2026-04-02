import { computed } from '@angular/core';

import { createCommonCtaI18n } from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  AboutCard,
  AboutCardRaw,
  AboutHero,
  AboutSection,
  AboutSectionRaw,
  AboutSeo,
} from '../../../core/types/i18n/about';
import {
  dictToSortedArray,
  numberedDictToStringArray,
} from '../../../core/utils/dict-to-sorted-array';

export function createAboutI18n() {
  const commonCta = createCommonCtaI18n();
  const { hero, seo, sectionsDict, cardsDict } = createScopedSectionsI18n<{
    hero: AboutHero;
    seo: AboutSeo;
    sectionsDict: Record<string, AboutSectionRaw>;
    cardsDict: Record<string, AboutCardRaw>;
  }>('about', {
    hero: 'hero',
    seo: 'seo',
    sectionsDict: 'sections',
    cardsDict: 'cards',
  });

  const sections = computed<AboutSection[]>(() =>
    dictToSortedArray<AboutSectionRaw>(
      sectionsDict() as never,
      (item) => Number((item as { id?: number })?.id ?? 0),
    ).map((item) => ({
      id: Number((item as { id?: number })?.id ?? 0),
      title: String((item as { title?: string })?.title ?? ''),
      paragraphs: numberedDictToStringArray(
        (item as { paragraphs?: Record<string, string> })?.paragraphs,
      ),
    })),
  );

  const cards = computed<AboutCard[]>(() =>
    dictToSortedArray<AboutCardRaw>(
      cardsDict() as never,
      (item) => Number((item as { id?: number })?.id ?? 0),
    ).map((item) => ({
      id: Number((item as { id?: number })?.id ?? 0),
      title: String((item as { title?: string })?.title ?? ''),
      paragraphs: numberedDictToStringArray(
        (item as { paragraphs?: Record<string, string> })?.paragraphs,
      ),
    })),
  );

  return {
    seo,
    hero,
    sections,
    cards,
    commonCta,
  };
}
