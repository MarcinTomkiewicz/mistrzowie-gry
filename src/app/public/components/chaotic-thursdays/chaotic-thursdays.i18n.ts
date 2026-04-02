import { computed } from '@angular/core';

import { IconTech } from '../../../core/types/icon-tech';
import {
  ChaoticThursdaysAboutTranslations,
  ChaoticThursdaysCardItem,
  ChaoticThursdaysFaqItem,
  ChaoticThursdaysHeroCtaTranslations,
  ChaoticThursdaysHeroInfoTranslations,
  ChaoticThursdaysHeroTranslations,
  ChaoticThursdaysSectionTranslations,
  ChaoticThursdaysSeoTranslations,
  ChaoticThursdaysStandardsTranslations,
  ChaoticThursdaysStepItem,
} from '../../../core/types/i18n/chaotic-thursdays';
import {
  createCommonActionsI18n,
  createCommonCtaI18n,
  createCommonInfoI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  dictToSortedArray,
  numberedDictToStringArray,
  withIcons,
} from '../../../core/utils/dict-to-sorted-array';

function toSortedById<T>(dict: unknown): T[] {
  return dictToSortedArray<T>(dict as never, (x) =>
    Number((x as { id?: number })?.id ?? 0),
  );
}

export function createChaoticThursdaysI18n(
  highlightIcons: readonly IconTech[],
  standardsIcons: readonly IconTech[],
) {
  const {
    seo,
    hero,
    heroInfo,
    heroCta,
    about,
    howItWorks,
    standards,
    faq,
    highlightsDict,
    stepsDict,
    standardsCardsDict,
    expectationsDict,
    faqItemsDict,
  } = createScopedSectionsI18n<{
    seo: ChaoticThursdaysSeoTranslations;
    hero: ChaoticThursdaysHeroTranslations;
    heroInfo: ChaoticThursdaysHeroInfoTranslations;
    heroCta: ChaoticThursdaysHeroCtaTranslations;
    about: ChaoticThursdaysAboutTranslations;
    howItWorks: ChaoticThursdaysSectionTranslations;
    standards: ChaoticThursdaysStandardsTranslations;
    faq: ChaoticThursdaysSectionTranslations;
    highlightsDict: Record<string, ChaoticThursdaysCardItem>;
    stepsDict: Record<string, ChaoticThursdaysStepItem>;
    standardsCardsDict: Record<string, ChaoticThursdaysCardItem>;
    expectationsDict: Record<string, string>;
    faqItemsDict: Record<string, ChaoticThursdaysFaqItem>;
  }>('chaoticThursdays', {
    seo: 'seo',
    hero: 'hero',
    heroInfo: 'heroInfo',
    heroCta: 'cta',
    about: 'about',
    howItWorks: 'howItWorks',
    standards: 'standards',
    faq: 'faq',
    highlightsDict: 'about.highlights',
    stepsDict: 'howItWorks.steps',
    standardsCardsDict: 'standards.cards',
    expectationsDict: 'standards.expectations',
    faqItemsDict: 'faq.items',
  });

  const actions = createCommonActionsI18n();
  const info = createCommonInfoI18n();
  const commonCta = createCommonCtaI18n();

  const highlights = computed(() => {
    const list = toSortedById<ChaoticThursdaysCardItem>(highlightsDict());
    return withIcons(list, highlightIcons);
  });

  const steps = computed(() =>
    toSortedById<ChaoticThursdaysStepItem>(stepsDict()).map(({ time, title, text }) => ({
      time,
      title,
      text,
    })),
  );

  const standardsCards = computed(() => {
    const list = toSortedById<ChaoticThursdaysCardItem>(standardsCardsDict());
    return withIcons(list, standardsIcons);
  });

  const expectations = computed(() =>
    numberedDictToStringArray(expectationsDict() as never),
  );

  const faqs = computed(() =>
    toSortedById<ChaoticThursdaysFaqItem>(faqItemsDict()),
  );

  return {
    seo,
    actions,
    info,
    hero,
    heroInfo,
    heroCta,
    about,
    howItWorks,
    standards,
    faq,
    commonCta,
    highlights,
    steps,
    standardsCards,
    expectations,
    faqs,
  };
}
