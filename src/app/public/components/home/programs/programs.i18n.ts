import { computed } from '@angular/core';
import { translateObjectSignal } from '@jsverse/transloco';

import {
  dictToSortedArray,
  numberedDictToStringArray,
} from '../../../../core/utils/dict-to-sorted-array';
import { pickTranslations } from '../../../../core/utils/pick-translation';

export type ProgramsCardCopy = {
  id: number;
  title: string;
  intro: string;
  bullets: Record<string, string>;
};

export type CtaKey = 'checkDetails' | 'seeProgram';

export type ProgramsHeader = {
  title: string;
  subtitle: string;
};

export function createProgramsI18n() {
  const headerDict = translateObjectSignal(
    'programs.header',
    {},
    { scope: 'home' },
  );

  const cardsDict = translateObjectSignal(
    'programs.cards',
    {},
    { scope: 'home' },
  );

  const ctaDict = translateObjectSignal(
    'cta',
    {},
    { scope: 'common' },
  );

  const header = computed<ProgramsHeader>(() => {
    const picked = pickTranslations(headerDict, ['title', 'subtitle'] as const)();

    return {
      title: picked.title || '',
      subtitle: picked.subtitle || '',
    };
  });

  const cta = computed(() =>
    pickTranslations(ctaDict, ['checkDetails', 'seeProgram'] as const)(),
  );

  const cardsCopy = computed(() =>
    dictToSortedArray<ProgramsCardCopy>(
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