import { computed } from '@angular/core';
import { translateObjectSignal } from '@jsverse/transloco';

import { dictToSortedArray } from '../../../../core/utils/dict-to-sorted-array';
import { pickTranslations } from '../../../../core/utils/pick-translation';

export type ProblemCardCopy = {
  id: number;
  title: string;
  text: string;
};

export type CtaKey =
  | 'joinProgram'
  | 'offerIndividual'
  | 'chaoticThursdays'
  | 'offerBusiness';

export type ProblemsHeader = {
  title: string;
  subtitle: string;
};

export function createProblemsI18n() {
  const headerDict = translateObjectSignal(
    'problems.header',
    {},
    { scope: 'home' },
  );

  const cardsDict = translateObjectSignal(
    'problems.cards',
    {},
    { scope: 'home' },
  );

  const ctaDict = translateObjectSignal(
    'cta',
    {},
    { scope: 'common' },
  );

  const header = computed<ProblemsHeader>(() => {
    const picked = pickTranslations(headerDict, ['title', 'subtitle'] as const)();

    return {
      title: picked.title || '',
      subtitle: picked.subtitle || '',
    };
  });

  const cta = computed(() =>
    pickTranslations(ctaDict, [
      'joinProgram',
      'offerIndividual',
      'chaoticThursdays',
      'offerBusiness',
    ] as const)(),
  );

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