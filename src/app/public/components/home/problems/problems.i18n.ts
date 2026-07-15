import { computed } from '@angular/core';

import { createCommonCtaI18n } from '../../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import {
  ProblemCardCopy,
  ProblemsHeader,
} from '../../../../core/types/i18n/home';
import { recordValuesSortedBy } from '../../../../core/utils/record-values';

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
    recordValuesSortedBy(cardsDict(), (item) => item.id),
  );

  return {
    header,
    cta,
    cardsCopy,
  };
}
