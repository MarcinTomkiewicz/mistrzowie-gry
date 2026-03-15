import { computed } from '@angular/core';
import {
  translateObjectSignal,
  translateSignal,
} from '@jsverse/transloco';

import { IconTech } from '../../../core/types/icon-tech';
import {
  dictToSortedArray,
  numberedDictToStringArray,
  withIcons,
} from '../../../core/utils/dict-to-sorted-array';
import { pickTranslations } from '../../../core/utils/pick-translation';
import { CommonActionsTranslations, CommonInfoTranslations } from '../../../core/types/common-i18n';

function toSortedById<T>(dict: unknown): T[] {
  return dictToSortedArray<T>(dict as never, (x) =>
    Number((x as { id?: number })?.id ?? 0),
  );
}

export function createChaoticThursdaysI18n(
  highlightIcons: readonly IconTech[],
  standardsIcons: readonly IconTech[],
) {
  const seoTitle = translateSignal('seo.title', {}, { scope: 'chaoticThursdays' });
  const seoDescription = translateSignal(
    'seo.description',
    {},
    { scope: 'chaoticThursdays' },
  );

  const heroDict = translateObjectSignal('hero', {}, { scope: 'chaoticThursdays' });
  const heroInfoDict = translateObjectSignal('heroInfo', {}, { scope: 'chaoticThursdays' });
  const pageCtaDict = translateObjectSignal('cta', {}, { scope: 'chaoticThursdays' });
  const aboutDict = translateObjectSignal('about', {}, { scope: 'chaoticThursdays' });
  const howDict = translateObjectSignal(
    'howItWorks',
    {},
    { scope: 'chaoticThursdays' },
  );
  const standardsDict = translateObjectSignal(
    'standards',
    {},
    { scope: 'chaoticThursdays' },
  );
  const faqDict = translateObjectSignal('faq', {}, { scope: 'chaoticThursdays' });
  const commonCtaDict = translateObjectSignal('cta', {}, { scope: 'common' });

  const actionsDict = translateObjectSignal('actions', {}, { scope: 'common' });
const infoDict = translateObjectSignal('info', {}, { scope: 'common' });

const actions = computed(() => actionsDict() as CommonActionsTranslations);
const info = computed(() => infoDict() as CommonInfoTranslations);

  const highlightsDict = translateObjectSignal(
    'about.highlights',
    {},
    { scope: 'chaoticThursdays' },
  );
  const stepsDict = translateObjectSignal(
    'howItWorks.steps',
    {},
    { scope: 'chaoticThursdays' },
  );
  const standardsCardsDict = translateObjectSignal(
    'standards.cards',
    {},
    { scope: 'chaoticThursdays' },
  );
  const expectationsDict = translateObjectSignal(
    'standards.expectations',
    {},
    { scope: 'chaoticThursdays' },
  );
  const faqItemsDict = translateObjectSignal(
    'faq.items',
    {},
    { scope: 'chaoticThursdays' },
  );

  const hero = pickTranslations(heroDict, [
    'badge',
    'title',
    'subtitleLead',
    'subtitleStrong',
  ] as const);

    const heroInfo = pickTranslations(heroInfoDict, [
      'title',
    'chaoticPlace',
    'chaoticSchedule',
    'chaoticPrice',
  ] as const);


  const heroCta = pickTranslations(pageCtaDict, [
    'primaryLabel',
    'secondaryLabel',
  ] as const);

  const about = pickTranslations(aboutDict, ['title', 'text'] as const);
  const howItWorks = pickTranslations(howDict, ['title', 'subtitle'] as const);

  const standards = pickTranslations(standardsDict, [
    'title',
    'subtitle',
    'expectationsTitle',
  ] as const);

  const faq = pickTranslations(faqDict, ['title', 'subtitle'] as const);

  const commonCta = pickTranslations(commonCtaDict, [
    'joinProgram',
    'offerIndividual',
  ] as const);

  const highlights = computed(() => {
    const list = toSortedById<{ id: number; title: string; text: string }>(
      highlightsDict(),
    );
    return withIcons(list, highlightIcons);
  });

  const steps = computed(() =>
    toSortedById<{ id: number; time: string; title: string; text: string }>(
      stepsDict(),
    ).map(({ time, title, text }) => ({
      time,
      title,
      text,
    })),
  );

  const standardsCards = computed(() => {
    const list = toSortedById<{ id: number; title: string; text: string }>(
      standardsCardsDict(),
    );
    return withIcons(list, standardsIcons);
  });

  const expectations = computed(() =>
    numberedDictToStringArray(expectationsDict() as never),
  );

  const faqs = computed(() =>
    toSortedById<{ id: number; h: string; a: string }>(faqItemsDict()),
  );

  return {
    seoTitle,
    seoDescription,
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