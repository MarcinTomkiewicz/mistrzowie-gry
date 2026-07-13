import { computed } from '@angular/core';

import {
  dictToSortedArray,
  numberedDictToStringArray,
  withIcons,
} from '../../../core/utils/dict-to-sorted-array';
import { createCommonCtaI18n } from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  BulletGroupCopy,
  CardCopy,
  HeroCopy,
  MeetingFormatLabels,
  SectionCopy,
  SeoCopy,
  SummaryByFormat,
} from '../../../core/types/i18n/join-the-party';
import { IconTech } from '../../../core/types/icon-tech';

export function createJoinThePartyI18n(
  benefitIcons: readonly IconTech[],
  stepIcons: readonly IconTech[],
) {
  const {
    seo,
    hero,
    meetingFormat,
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
    seo: SeoCopy;
    hero: HeroCopy;
    meetingFormat: MeetingFormatLabels;
    heroInfo: SummaryByFormat;
    intro: SectionCopy;
    structure: SectionCopy;
    continuation: SectionCopy;
    orgMeeting: SectionCopy;
    benefitsDict: Record<string, CardCopy>;
    stepsDict: Record<string, CardCopy>;
    rulesBlock: BulletGroupCopy;
    continuationBulletsBlock: BulletGroupCopy;
    orgMeetingBulletsBlock: BulletGroupCopy;
  }>('joinTheParty', {
    seo: 'seo',
    hero: 'hero',
    meetingFormat: 'meetingFormat',
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
  const orgMeetingBulletsTitle = computed(() => orgMeetingBulletsBlock().title);

  const benefits = computed(() => {
    const list = dictToSortedArray<CardCopy>(benefitsDict(), (item) => item.id);
    return withIcons(list, benefitIcons);
  });

  const steps = computed(() => {
    const list = dictToSortedArray<CardCopy>(stepsDict(), (item) => item.id);
    return withIcons(list, stepIcons);
  });

  const rules = computed(() => numberedDictToStringArray(rulesBlock()));
  const continuationBullets = computed(() =>
    numberedDictToStringArray(continuationBulletsBlock()),
  );
  const orgMeetingBullets = computed(() =>
    numberedDictToStringArray(orgMeetingBulletsBlock()),
  );

  return {
    seo,
    hero,
    meetingFormat,
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
