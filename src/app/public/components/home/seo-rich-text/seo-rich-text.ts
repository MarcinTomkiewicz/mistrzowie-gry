// path: src/app/features/home/components/seo-text/seo-text.ts
import { CommonModule } from '@angular/common';
import { Component, computed } from '@angular/core';

import { provideTranslocoScope, translateObjectSignal } from '@jsverse/transloco';

import {
  dictToSortedArray,
  numberedDictToStringArray,
} from '../../../../core/utils/dict-to-sorted-array';
import { pickTranslations } from '../../../../core/utils/pick-translation';

type SeoTextSectionCopy = {
  id: number;
  title: string;
  paragraphs: Record<string, string>;
};

type SeoTextColumnCopy = {
  id: number;
  sections: Record<string, SeoTextSectionCopy>;
};

@Component({
  selector: 'app-seo-rich-text',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seo-rich-text.html',
  styleUrl: './seo-rich-text.scss',
  providers: [provideTranslocoScope('home')],
})
export class SeoRichText {
  private readonly headerDict = translateObjectSignal(
    'seoText.header',
    {},
    { scope: 'home' },
  );
  private readonly columnsDict = translateObjectSignal(
    'seoText.columns',
    {},
    { scope: 'home' },
  );

  readonly header = pickTranslations(this.headerDict, ['title', 'subtitle'] as const);

  readonly columns = computed(() => {
    const colsDict = this.columnsDict();

    const cols = dictToSortedArray<SeoTextColumnCopy>(colsDict as any, (col) =>
      Number((col as any)?.id ?? 0),
    ).map((col) => {
      const sectionsDict = ((col as any)?.sections ?? {}) as Record<string, any>;

      const sections = dictToSortedArray<SeoTextSectionCopy>(
        sectionsDict as any,
        (s) => Number((s as any)?.id ?? 0),
      ).map((s) => ({
        id: Number((s as any)?.id ?? 0),
        title: String((s as any)?.title ?? ''),
        paragraphs: numberedDictToStringArray(((s as any)?.paragraphs ?? {}) as any),
      }));

      return {
        id: Number((col as any)?.id ?? 0),
        sections,
      };
    });

    return cols;
  });

  trackByColId = (_: number, col: { id: number }) => col.id;
  trackBySectionId = (_: number, section: { id: number }) => section.id;
  trackByIndex = (i: number) => i;
}
