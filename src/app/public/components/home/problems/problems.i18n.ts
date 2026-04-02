import { computed } from '@angular/core';

import { createCommonCtaI18n } from '../../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import {
  ProblemCardCopy,
  ProblemsHeader,
} from '../../../../core/types/i18n/home';
import { dictToSortedArray } from '../../../../core/utils/dict-to-sorted-array';

export function createProblemsI18n() {
  const { header, cardsDict } = createScopedSectionsI18n<{
    header: ProblemsHeader;
    cardsDict: Record<string, ProblemCardCopy>;
  }>('home', {
    header: 'problems.header',
    cardsDict: 'problems.cards',
  });
  const cta = createCommonCtaI18n();

  const cardsCopy = computed<ProblemCardCopy[]>(() =>
    dictToSortedArray<ProblemCardCopy>(
      cardsDict() as never,
      (item) => Number((item as { id?: number })?.id ?? 0),
    ).map((item) => ({
      id: Number((item as { id?: number })?.id ?? 0),
      title: String((item as { title?: string })?.title ?? ''),
      text: String((item as { text?: string })?.text ?? ''),
    })),
  );

  return {
    header,
    cta,
    cardsCopy,
  };
}
