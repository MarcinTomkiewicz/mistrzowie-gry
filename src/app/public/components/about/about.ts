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

function toSortedById<T>(dict: unknown): T[] {
  return dictToSortedArray<T>(dict as any, (x) => Number((x as any)?.id ?? 0));
}

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

  constructor() {
    this.transloco.setActiveLang('pl');
  }

  // ===============
  // SEO (scope: about)
  // ===============
  readonly seoTitle = translateSignal('seo.title', {}, { scope: 'about' });
  readonly seoDescription = translateSignal('seo.description', {}, { scope: 'about' });

  private readonly _applySeo = effect(() => {
    this.seo.apply({
      title: this.seoTitle() || 'O nas',
      description: this.seoDescription() || '',
    });
  });

  // ===============
  // i18n dicts
  // ===============
  private readonly commonCtaDict = translateObjectSignal('cta', {}, { scope: 'common' });
  private readonly heroDict = translateObjectSignal('hero', {}, { scope: 'about' });
  private readonly sectionsDict = translateObjectSignal('sections', {}, { scope: 'about' });
  private readonly cardsDict = translateObjectSignal('cards', {}, { scope: 'about' });

  // ===============
  // picked (flat)
  // ===============
  private readonly commonCta = pickTranslations(this.commonCtaDict, [
    'contactUs',
    'joinProgram',
  ] as const);

  private readonly hero = pickTranslations(this.heroDict, ['title', 'subtitle'] as const);

  // ===============
  // lists
  // ===============
  private readonly sections = computed(() => {
    return toSortedById<{ id: number; title: string; paragraphs: unknown }>(this.sectionsDict()).map((x) => ({
      id: Number((x as any)?.id ?? 0),
      title: String((x as any)?.title ?? ''),
      paragraphs: numberedDictToStringArray((x as any)?.paragraphs),
    }));
  });

  private readonly cards = computed(() => {
    return toSortedById<{ id: number; title: string; paragraphs: unknown }>(this.cardsDict()).map((x) => ({
      id: Number((x as any)?.id ?? 0),
      title: String((x as any)?.title ?? ''),
      paragraphs: numberedDictToStringArray((x as any)?.paragraphs),
    }));
  });

  // ===============
  // View model
  // ===============
  readonly vm = computed(() => ({
    hero: this.hero(),
    sections: this.sections(),
    cards: this.cards(),
    commonCta: this.commonCta(),
  }));

  trackByIndex = (i: number) => i;
}