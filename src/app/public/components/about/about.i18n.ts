import { computed } from '@angular/core';

import { createCommonNavI18n } from '../../../core/translations/common.i18n';
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
  numberedRecordToStringArray,
  recordValuesSortedBy,
} from '../../../core/utils/record-values';

export function createAboutI18n() {
  const commonNav = createCommonNavI18n();
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
    recordValuesSortedBy(
      sectionsDict(),
      (item) => item.id,
    ).map((item) => ({
      id: item.id,
      title: item.title,
      paragraphs: numberedRecordToStringArray(item.paragraphs),
    })),
  );

  const cards = computed<AboutCard[]>(() =>
    recordValuesSortedBy(
      cardsDict(),
      (item) => item.id,
    ).map((item) => ({
      id: item.id,
      title: item.title,
      paragraphs: numberedRecordToStringArray(item.paragraphs),
    })),
  );

  return {
    seo,
    hero,
    sections,
    cards,
    commonNav,
  };
}
