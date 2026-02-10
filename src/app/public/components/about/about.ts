import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import {
  provideTranslocoScope,
  translateObjectSignal,
  translateSignal,
  TranslocoService,
} from '@jsverse/transloco';

import { Seo } from '../../../core/services/seo/seo';
import {
  dictToSortedArray,
  numberedDictToStringArray,
} from '../../../core/utils/dict-to-sorted-array';
import { pickTranslations } from '../../../core/utils/pick-translation';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './about.html',
  styleUrl: './about.scss',
  providers: [provideTranslocoScope('common'), provideTranslocoScope('about')],
})
export class About {
  private readonly seo = inject(Seo);
  private readonly transloco = inject(TranslocoService);

  readonly ctaDict = translateObjectSignal('cta', {}, { scope: 'common' });
  readonly heroDict = translateObjectSignal('hero', {}, { scope: 'about' });

  readonly aboutCommon = pickTranslations(this.ctaDict, [
    'contactUs',
    'joinProgram',
  ] as const);
  readonly heroData = pickTranslations(this.heroDict, ['title', 'subtitle'] as const);

  constructor() {
    this.transloco.setActiveLang('pl');
  }

  // ===============
  // SEO (stringi) – scope: about
  // ===============
  readonly seoTitle = translateSignal('seo.title', {}, { scope: 'about' });
  readonly seoDescription = translateSignal(
    'seo.description',
    {},
    { scope: 'about' },
  );

  private readonly _applySeo = effect(() => {
    this.seo.apply({
      title: this.seoTitle() || 'O nas',
      description: this.seoDescription() || '',
    });
  });

  // ==========================
  // STRUKTURY (obiekty z JSON)
  // ==========================
  readonly sectionsDict = translateObjectSignal(
    'sections',
    {},
    { scope: 'about' },
  );
  readonly cardsDict = translateObjectSignal('cards', {}, { scope: 'about' });

  // ==========================
  // VIEW MODEL (computed) – minimalny, bez subscribów i bez ręcznego mapowania translacji
  // ==========================
  readonly sections = computed(() => {
    const dict = this.sectionsDict();
    return dictToSortedArray<{
      id: number;
      title: string;
      paragraphs: string[];
    }>(dict, (item) => Number(item?.id ?? 0)).map((x) => ({
      id: Number(x?.id ?? 0),
      title: String((x as any)?.title ?? ''),
      paragraphs: numberedDictToStringArray((x as any)?.paragraphs),
    }));
  });

  readonly cards = computed(() => {
    const dict = this.cardsDict();
    return dictToSortedArray<{
      id: number;
      title: string;
      paragraphs: string[];
    }>(dict, (item) => Number(item?.id ?? 0)).map((x) => ({
      id: Number(x?.id ?? 0),
      title: String((x as any)?.title ?? ''),
      paragraphs: numberedDictToStringArray((x as any)?.paragraphs),
    }));
  });
}
