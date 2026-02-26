// path: src/app/features/special-offers/chaotic-thursdays/chaotic-thursdays.ts
import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import {
  provideTranslocoScope,
  TranslocoService,
  translateObjectSignal,
  translateSignal,
} from '@jsverse/transloco';

import { Seo } from '../../../core/services/seo/seo';
import {
  dictToSortedArray,
  numberedDictToStringArray,
  withIcons,
} from '../../../core/utils/dict-to-sorted-array';
import { pickTranslations } from '../../../core/utils/pick-translation';
import { IconTech } from '../../../core/types/icon-tech';

function toSortedById<T>(dict: unknown): T[] {
  return dictToSortedArray<T>(dict as any, (x) => Number((x as any)?.id ?? 0));
}

@Component({
  selector: 'app-chaotic-thursdays',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, AccordionModule, TableModule],
  templateUrl: './chaotic-thursdays.html',
  styleUrl: './chaotic-thursdays.scss',
  providers: [provideTranslocoScope('chaoticThursdays'), provideTranslocoScope('common')],
})
export class ChaoticThursdays {
  private readonly seo = inject(Seo);
  private readonly transloco = inject(TranslocoService);

  // ============
  // SEO
  // ============
  readonly seoTitle = translateSignal('seo.title', {}, { scope: 'chaoticThursdays' });
  readonly seoDescription = translateSignal('seo.description', {}, { scope: 'chaoticThursdays' });

  private readonly _applySeo = effect(() => {
    this.seo.apply({
      title: this.seoTitle() || 'Chaotyczne Czwartki',
      description: this.seoDescription() || '',
    });
  });

  constructor() {
    this.transloco.setActiveLang('pl');
  }

  // ============
  // flat sections
  // ============
  private readonly heroDict = translateObjectSignal('hero', {}, { scope: 'chaoticThursdays' });
  private readonly pageCtaDict = translateObjectSignal('cta', {}, { scope: 'chaoticThursdays' });
  private readonly aboutDict = translateObjectSignal('about', {}, { scope: 'chaoticThursdays' });
  private readonly howDict = translateObjectSignal('howItWorks', {}, { scope: 'chaoticThursdays' });
  private readonly standardsDict = translateObjectSignal('standards', {}, { scope: 'chaoticThursdays' });
  private readonly faqDict = translateObjectSignal('faq', {}, { scope: 'chaoticThursdays' });

  private readonly commonCtaDict = translateObjectSignal('cta', {}, { scope: 'common' });

  private readonly hero = pickTranslations(this.heroDict, [
    'badge',
    'title',
    'subtitleLead',
    'subtitleStrong',
  ] as const);

  private readonly heroCta = pickTranslations(this.pageCtaDict, [
    'primaryLabel',
    'secondaryLabel',
  ] as const);

  private readonly about = pickTranslations(this.aboutDict, ['title', 'text'] as const);
  private readonly howItWorks = pickTranslations(this.howDict, ['title', 'subtitle'] as const);

  private readonly standards = pickTranslations(this.standardsDict, [
    'title',
    'subtitle',
    'expectationsTitle',
  ] as const);

  private readonly faq = pickTranslations(this.faqDict, ['title', 'subtitle'] as const);

  private readonly commonCta = pickTranslations(this.commonCtaDict, [
    'joinProgram',
    'offerIndividual',
  ] as const);

  // ============
  // lists
  // ============
  private readonly highlightsDict = translateObjectSignal('about.highlights', {}, { scope: 'chaoticThursdays' });
  private readonly stepsDict = translateObjectSignal('howItWorks.steps', {}, { scope: 'chaoticThursdays' });
  private readonly standardsCardsDict = translateObjectSignal('standards.cards', {}, { scope: 'chaoticThursdays' });
  private readonly expectationsDict = translateObjectSignal('standards.expectations', {}, { scope: 'chaoticThursdays' });
  private readonly faqItemsDict = translateObjectSignal('faq.items', {}, { scope: 'chaoticThursdays' });

  private readonly highlightIcons: IconTech[] = [
    { id: 1, icon: 'pi pi-bolt' },
    { id: 2, icon: 'pi pi-question-circle' },
    { id: 3, icon: 'pi pi-users' },
    { id: 4, icon: 'pi pi-star' },
  ];

  private readonly standardsIcons: IconTech[] = [
    { id: 1, icon: 'pi pi-shield' },
    { id: 2, icon: 'pi pi-clock' },
    { id: 3, icon: 'pi pi-comments' },
    { id: 4, icon: 'pi pi-check' },
  ];

  private readonly highlights = computed(() => {
    const list = toSortedById<{ id: number; title: string; text: string }>(this.highlightsDict());
    return withIcons(list, this.highlightIcons);
  });

  private readonly steps = computed(() => {
    return toSortedById<{ id: number; time: string; title: string; text: string }>(this.stepsDict()).map(
      ({ time, title, text }) => ({ time, title, text }),
    );
  });

  private readonly standardsCards = computed(() => {
    const list = toSortedById<{ id: number; title: string; text: string }>(this.standardsCardsDict());
    return withIcons(list, this.standardsIcons);
  });

  private readonly expectations = computed(() =>
    numberedDictToStringArray(this.expectationsDict() as any),
  );

  // ✅ FAQ bez mapowania q -> h (JSON już ma h/a)
  private readonly faqs = computed(() => {
    return toSortedById<{ id: number; h: string; a: string }>(this.faqItemsDict());
  });

  // ============
  // View model
  // ============
  readonly vm = computed(() => ({
    hero: this.hero(),
    heroCta: this.heroCta(),

    about: this.about(),
    highlights: this.highlights(),

    howItWorks: this.howItWorks(),
    steps: this.steps(),

    standards: this.standards(),
    standardsCards: this.standardsCards(),
    expectations: this.expectations(),

    faq: this.faq(),
    faqs: this.faqs(),

    commonCta: this.commonCta(),
  }));

  trackByIndex = (i: number) => i;
}