import { computed } from '@angular/core';
import { translateObjectSignal } from '@jsverse/transloco';

import {
  dictToSortedArray,
  numberedDictToStringArray,
} from '../../../../core/utils/dict-to-sorted-array';
import { pickTranslations } from '../../../../core/utils/pick-translation';

export type SeoTextSectionCopy = {
  id: number;
  title: string;
  paragraphs: Record<string, string>;
};

export type SeoTextColumnCopy = {
  id: number;
  sections: Record<string, SeoTextSectionCopy>;
};

export type UiSeoTextSection = {
  id: number;
  title: string;
  paragraphs: string[];
};

export type UiSeoTextColumn = {
  id: number;
  sections: UiSeoTextSection[];
};

export type SeoTextHeader = {
  title: string;
  subtitle: string;
};

export function createSeoRichTextI18n() {
  const headerDict = translateObjectSignal(
    'seoText.header',
    {},
    { scope: 'home' },
  );

  const columnsDict = translateObjectSignal(
    'seoText.columns',
    {},
    { scope: 'home' },
  );

  const header = computed<SeoTextHeader>(() => {
    const picked = pickTranslations(headerDict, ['title', 'subtitle'] as const)();

    return {
      title: picked.title || '',
      subtitle: picked.subtitle || '',
    };
  });

  const columns = computed<UiSeoTextColumn[]>(() =>
    dictToSortedArray<SeoTextColumnCopy>(
      columnsDict() as never,
      (col) => Number((col as { id?: number })?.id ?? 0),
    ).map((col) => {
      const sectionsDict =
        ((col as { sections?: Record<string, SeoTextSectionCopy> })?.sections ?? {});

      const sections = dictToSortedArray<SeoTextSectionCopy>(
        sectionsDict as never,
        (section) => Number((section as { id?: number })?.id ?? 0),
      ).map((section) => ({
        id: Number((section as { id?: number })?.id ?? 0),
        title: String((section as { title?: string })?.title ?? ''),
        paragraphs: numberedDictToStringArray(
          ((section as { paragraphs?: Record<string, string> })?.paragraphs ?? {}),
        ),
      }));

      return {
        id: Number((col as { id?: number })?.id ?? 0),
        sections,
      };
    }),
  );

  return {
    header,
    columns,
  };
}