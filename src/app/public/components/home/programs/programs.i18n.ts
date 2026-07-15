import { computed } from '@angular/core';

import { createCommonCtaI18n } from '../../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import {
  ProgramsCardCopy,
  ProgramsCardCopyRaw,
  ProgramsHeader,
} from '../../../../core/types/i18n/home';
import {
  numberedRecordToStringArray,
  recordValuesSortedBy,
} from '../../../../core/utils/record-values';

export function createProgramsI18n() {
  const { header, cardsDict } = createScopedSectionsI18n<{
    header: ProgramsHeader;
    cardsDict: Record<string, ProgramsCardCopyRaw>;
  }>('home', {
    header: 'programs.header',
    cardsDict: 'programs.cards',
  });
  const cta = createCommonCtaI18n();

  const cardsCopy = computed<ProgramsCardCopy[]>(() =>
    recordValuesSortedBy(
      cardsDict(),
      (item) => item.id,
    ).map((item) => ({
      id: item.id,
      title: item.title,
      intro: item.intro,
      bullets: numberedRecordToStringArray(item.bullets),
    })),
  );

  return {
    header,
    cta,
    cardsCopy,
  };
}
