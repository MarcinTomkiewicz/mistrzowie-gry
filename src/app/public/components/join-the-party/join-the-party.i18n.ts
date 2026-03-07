import { Signal, computed } from '@angular/core';
import {
  translateObjectSignal,
  translateSignal,
} from '@jsverse/transloco';

import {
  dictToSortedArray,
  numberedDictToStringArray,
  withIcons,
} from '../../../core/utils/dict-to-sorted-array';
import { pickTranslations } from '../../../core/utils/pick-translation';
import { IconTech } from '../../../core/types/icon-tech';

const TITLE_SUBTITLE = ['title', 'subtitle'] as const;

function toSortedById<T>(dict: unknown): T[] {
  return dictToSortedArray<T>(dict as never, (x) =>
    Number((x as { id?: number })?.id ?? 0),
  );
}

function createSectionTitleSubtitle(
  key: string,
): Signal<{ title: string; subtitle: string }> {
  const dict = translateObjectSignal(key, {}, { scope: 'joinTheParty' });
  return pickTranslations(dict, TITLE_SUBTITLE);
}

export function createJoinThePartyI18n(
  benefitIcons: readonly IconTech[],
  stepIcons: readonly IconTech[],
) {
  const seoTitle = translateSignal('seo.title', {}, { scope: 'joinTheParty' });
  const seoDescription = translateSignal('seo.description', {}, { scope: 'joinTheParty' });

  const heroDict = translateObjectSignal('hero', {}, { scope: 'joinTheParty' });
  const commonCtaDict = translateObjectSignal('cta', {}, { scope: 'common' });

  const rulesTitleDict = translateObjectSignal(
    'structure.rules',
    {},
    { scope: 'joinTheParty' },
  );

  const continuationBulletsTitleDict = translateObjectSignal(
    'continuation.bullets',
    {},
    { scope: 'joinTheParty' },
  );

  const orgMeetingBulletsTitleDict = translateObjectSignal(
    'orgMeeting.bullets',
    {},
    { scope: 'joinTheParty' },
  );

  const benefitsDict = translateObjectSignal(
    'intro.benefits',
    {},
    { scope: 'joinTheParty' },
  );

  const stepsDict = translateObjectSignal(
    'structure.steps',
    {},
    { scope: 'joinTheParty' },
  );

  const rulesDict = translateObjectSignal(
    'structure.rules',
    {},
    { scope: 'joinTheParty' },
  );

  const continuationBulletsDict = translateObjectSignal(
    'continuation.bullets',
    {},
    { scope: 'joinTheParty' },
  );

  const orgMeetingBulletsDict = translateObjectSignal(
    'orgMeeting.bullets',
    {},
    { scope: 'joinTheParty' },
  );

  const hero = pickTranslations(heroDict, ['badge', 'title', 'subtitle'] as const);
  const cta = pickTranslations(commonCtaDict, ['contactUs', 'joinProgram'] as const);

  const intro = createSectionTitleSubtitle('intro');
  const structure = createSectionTitleSubtitle('structure');
  const continuation = createSectionTitleSubtitle('continuation');
  const orgMeeting = createSectionTitleSubtitle('orgMeeting');

  const rulesTitle = pickTranslations(rulesTitleDict, ['title'] as const);
  const continuationBulletsTitle = pickTranslations(
    continuationBulletsTitleDict,
    ['title'] as const,
  );
  const orgMeetingBulletsTitle = pickTranslations(
    orgMeetingBulletsTitleDict,
    ['title'] as const,
  );

  const benefits = computed(() => {
    const list = toSortedById<{ id: number; title: string; text: string }>(
      benefitsDict(),
    );
    return withIcons(list, benefitIcons);
  });

  const steps = computed(() => {
    const list = toSortedById<{ id: number; title: string; text: string }>(
      stepsDict(),
    );
    return withIcons(list, stepIcons);
  });

  const rules = computed(() => numberedDictToStringArray(rulesDict() as never));
  const continuationBullets = computed(() =>
    numberedDictToStringArray(continuationBulletsDict() as never),
  );
  const orgMeetingBullets = computed(() =>
    numberedDictToStringArray(orgMeetingBulletsDict() as never),
  );

  return {
    seoTitle,
    seoDescription,
    hero,
    cta,
    intro,
    structure,
    continuation,
    orgMeeting,
    rulesTitle,
    continuationBulletsTitle,
    orgMeetingBulletsTitle,
    benefits,
    steps,
    rules,
    continuationBullets,
    orgMeetingBullets,
  };
}