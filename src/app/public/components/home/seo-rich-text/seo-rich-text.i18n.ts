import { computed } from '@angular/core';

import {
  SeoTextColumnCopy,
  SeoTextHeader,
  SeoTextSectionCopy,
  UiSeoTextColumn,
} from '../../../../core/types/i18n/home';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import {
  dictToSortedArray,
  numberedDictToStringArray,
} from '../../../../core/utils/dict-to-sorted-array';

export function createSeoRichTextI18n() {
  const { header, columnsDict } = createScopedSectionsI18n<{
    header: SeoTextHeader;
    columnsDict: Record<string, SeoTextColumnCopy>;
  }>('home', {
    header: 'seoText.header',
    columnsDict: 'seoText.columns',
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
