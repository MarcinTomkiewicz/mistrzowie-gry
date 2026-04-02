import { computed } from '@angular/core';

import {
  dictToSortedArray,
  numberedDictToStringArray,
  withIcons,
} from '../../../core/utils/dict-to-sorted-array';
import { createCommonCtaI18n } from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  JoinThePartyBulletGroupTranslations,
  JoinThePartyCardItem,
  JoinThePartyHeroInfoTranslations,
  JoinThePartyHeroTranslations,
  JoinThePartySectionTranslations,
  JoinThePartySeoTranslations,
} from '../../../core/types/i18n/join-the-party';
import { IconTech } from '../../../core/types/icon-tech';

function toSortedById<T>(dict: unknown): T[] {
  return dictToSortedArray<T>(dict as never, (x) =>
    Number((x as { id?: number })?.id ?? 0),
  );
}

export function createJoinThePartyI18n(
  benefitIcons: readonly IconTech[],
  stepIcons: readonly IconTech[],
) {
  const {
    seo,
    hero,
    heroInfo,
    intro,
    structure,
    continuation,
    orgMeeting,
    benefitsDict,
    stepsDict,
    rulesBlock,
    continuationBulletsBlock,
    orgMeetingBulletsBlock,
  } = createScopedSectionsI18n<{
    seo: JoinThePartySeoTranslations;
    hero: JoinThePartyHeroTranslations;
    heroInfo: JoinThePartyHeroInfoTranslations;
    intro: JoinThePartySectionTranslations;
    structure: JoinThePartySectionTranslations;
    continuation: JoinThePartySectionTranslations;
    orgMeeting: JoinThePartySectionTranslations;
    benefitsDict: Record<string, JoinThePartyCardItem>;
    stepsDict: Record<string, JoinThePartyCardItem>;
    rulesBlock: JoinThePartyBulletGroupTranslations;
    continuationBulletsBlock: JoinThePartyBulletGroupTranslations;
    orgMeetingBulletsBlock: JoinThePartyBulletGroupTranslations;
  }>('joinTheParty', {
    seo: 'seo',
    hero: 'hero',
    heroInfo: 'heroInfo',
    intro: 'intro',
    structure: 'structure',
    continuation: 'continuation',
    orgMeeting: 'orgMeeting',
    benefitsDict: 'intro.benefits',
    stepsDict: 'structure.steps',
    rulesBlock: 'structure.rules',
    continuationBulletsBlock: 'continuation.bullets',
    orgMeetingBulletsBlock: 'orgMeeting.bullets',
  });
  const cta = createCommonCtaI18n();

  const rulesTitle = computed(() => rulesBlock().title);
  const continuationBulletsTitle = computed(
    () => continuationBulletsBlock().title,
  );
  const orgMeetingBulletsTitle = computed(
    () => orgMeetingBulletsBlock().title,
  );

  const benefits = computed(() => {
    const list = toSortedById<JoinThePartyCardItem>(benefitsDict());
    return withIcons(list, benefitIcons);
  });

  const steps = computed(() => {
    const list = toSortedById<JoinThePartyCardItem>(stepsDict());
    return withIcons(list, stepIcons);
  });

  const rules = computed(() => numberedDictToStringArray(rulesBlock() as never));
  const continuationBullets = computed(() =>
    numberedDictToStringArray(continuationBulletsBlock() as never),
  );
  const orgMeetingBullets = computed(() =>
    numberedDictToStringArray(orgMeetingBulletsBlock() as never),
  );

  return {
    seo,
    hero,
    heroInfo,
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
