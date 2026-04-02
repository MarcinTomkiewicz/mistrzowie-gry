import { computed } from '@angular/core';

import { createCommonCtaI18n } from '../../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import {
  ProgramsCardCopy,
  ProgramsCardCopyRaw,
  ProgramsHeader,
} from '../../../../core/types/i18n/home';
import {
  dictToSortedArray,
  numberedDictToStringArray,
} from '../../../../core/utils/dict-to-sorted-array';

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
    dictToSortedArray<ProgramsCardCopyRaw>(
      cardsDict() as never,
      (item) => Number((item as { id?: number })?.id ?? 0),
    ).map((item) => ({
      id: Number((item as { id?: number })?.id ?? 0),
      title: String((item as { title?: string })?.title ?? ''),
      intro: String((item as { intro?: string })?.intro ?? ''),
      bullets: numberedDictToStringArray(
        ((item as { bullets?: Record<string, string> })?.bullets ?? {}),
      ),
    })),
  );

  return {
    header,
    cta,
    cardsCopy,
  };
}
