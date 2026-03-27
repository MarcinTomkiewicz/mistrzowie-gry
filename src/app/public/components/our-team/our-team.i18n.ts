import { computed } from '@angular/core';
import { translateObjectSignal } from '@jsverse/transloco';

import {
  CommonEmptyTranslations,
  CommonSeoTranslations,
  CommonStatusTranslations,
  OurTeamCardTranslations,
  OurTeamPageTranslations,
  OurTeamSeoTranslations,
} from '../../../core/types/common-i18n';

export function createOurTeamI18n() {
  const ourTeamPageDict = translateObjectSignal('page', {}, { scope: 'ourTeam' });
  const ourTeamSeoDict = translateObjectSignal('seo', {}, { scope: 'ourTeam' });
  const ourTeamCardDict = translateObjectSignal('card', {}, { scope: 'ourTeam' });

  const commonEmptyDict = translateObjectSignal('empty', {}, { scope: 'common' });
  const commonStatusDict = translateObjectSignal('status', {}, { scope: 'common' });
  const commonSeoDict = translateObjectSignal('seo', {}, { scope: 'common' });

  const page = computed(() => ourTeamPageDict() as OurTeamPageTranslations);
  const seo = computed(() => ourTeamSeoDict() as OurTeamSeoTranslations);
  const card = computed(() => ourTeamCardDict() as OurTeamCardTranslations);

  const commonEmpty = computed(() => commonEmptyDict() as CommonEmptyTranslations);
  const commonStatus = computed(() => commonStatusDict() as CommonStatusTranslations);
  const commonSeo = computed(() => commonSeoDict() as CommonSeoTranslations);

  return {
    page,
    seo,
    card,
    commonEmpty,
    commonStatus,
    commonSeo,
    imageAltLabel: (displayName: string) =>
      [card().imageAltPrefix, displayName].filter(Boolean).join(' ').trim(),
  };
}