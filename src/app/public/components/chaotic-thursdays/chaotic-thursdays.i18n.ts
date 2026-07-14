import { computed } from '@angular/core';

import { IconTech } from '../../../core/types/icon-tech';
import {
  AboutCopy,
  CardCopy,
  EditionSelectorCopy,
  ErrorCopy,
  FaqCopy,
  HeroCopy,
  HeroCtaCopy,
  HeroInfoCopy,
  SectionCopy,
  SeoCopy,
  StandardsCopy,
  StateCopy,
  StepCopy,
} from '../../../core/types/i18n/chaotic-thursdays';
import {
  createCommonActionsI18n,
  createCommonCtaI18n,
  createCommonErrorsI18n,
  createCommonStatusI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  dictToSortedArray,
  numberedDictToStringArray,
  withIcons,
} from '../../../core/utils/dict-to-sorted-array';

export function createChaoticThursdaysI18n(
  highlightIcons: readonly IconTech[],
  standardsIcons: readonly IconTech[],
) {
  const {
    seo,
    hero,
    heroInfo,
    editionSelector,
    states,
    errors,
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
    seo: SeoCopy;
    hero: HeroCopy;
    heroInfo: HeroInfoCopy;
    editionSelector: EditionSelectorCopy;
    states: StateCopy;
    errors: ErrorCopy;
    heroCta: HeroCtaCopy;
    about: AboutCopy;
    howItWorks: SectionCopy;
    standards: StandardsCopy;
    faq: SectionCopy;
    highlightsDict: Record<string, CardCopy>;
    stepsDict: Record<string, StepCopy>;
    standardsCardsDict: Record<string, CardCopy>;
    expectationsDict: Record<string, string>;
    faqItemsDict: Record<string, FaqCopy>;
  }>('chaoticThursdays', {
    seo: 'seo',
    hero: 'hero',
    heroInfo: 'heroInfo',
    editionSelector: 'editionSelector',
    states: 'states',
    errors: 'errors',
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
  const commonErrors = createCommonErrorsI18n();
  const commonCta = createCommonCtaI18n();
  const commonStatus = createCommonStatusI18n();

  const highlights = computed(() => {
    const list = dictToSortedArray<CardCopy>(
      highlightsDict(),
      (item) => item.id,
    );
    return withIcons(list, highlightIcons);
  });

  const steps = computed(() =>
    dictToSortedArray<StepCopy>(stepsDict(), (item) => item.id),
  );

  const standardsCards = computed(() => {
    const list = dictToSortedArray<CardCopy>(
      standardsCardsDict(),
      (item) => item.id,
    );
    return withIcons(list, standardsIcons);
  });

  const expectations = computed(() =>
    numberedDictToStringArray(expectationsDict()),
  );

  const faqs = computed(() =>
    dictToSortedArray<FaqCopy>(faqItemsDict(), (item) => item.id),
  );

  return {
    seo,
    actions,
    commonErrors,
    hero,
    heroInfo,
    editionSelector,
    states,
    errors,
    heroCta,
    about,
    howItWorks,
    standards,
    faq,
    commonCta,
    commonStatus,
    highlights,
    steps,
    standardsCards,
    expectations,
    faqs,
  };
}
