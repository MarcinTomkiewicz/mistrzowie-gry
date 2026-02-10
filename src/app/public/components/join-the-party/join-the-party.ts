// path: src/app/public/components/join-the-party/join-the-party.ts
import { CommonModule } from '@angular/common';
import { Component, Signal, computed, effect, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';

import {
  provideTranslocoScope,
  TranslocoService,
  translateObjectSignal,
  translateSignal,
} from '@jsverse/transloco';

import { Seo } from '../../../core/services/seo/seo';
import { IconTech } from '../../../core/types/icon-tech';
import { dictToSortedArray, numberedDictToStringArray, withIcons } from '../../../core/utils/dict-to-sorted-array';
import { pickTranslations } from '../../../core/utils/pick-translation';

function toSortedById<T>(dict: unknown): T[] {
  return dictToSortedArray<T>(dict as any, (x) => Number((x as any)?.id ?? 0));
}

const TITLE_SUBTITLE = ['title', 'subtitle'] as const;

@Component({
  selector: 'app-join-the-party',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, DividerModule],
  templateUrl: './join-the-party.html',
  styleUrl: './join-the-party.scss',
  providers: [provideTranslocoScope('joinTheParty'), provideTranslocoScope('common')],
})
export class JoinTheParty {
  private readonly seo = inject(Seo);
  private readonly transloco = inject(TranslocoService);

  constructor() {
    this.transloco.setActiveLang('pl');
  }

  // ============
  // SEO (scope: joinTheParty)
  // ============
  readonly seoTitle = translateSignal('seo.title', {}, { scope: 'joinTheParty' });
  readonly seoDescription = translateSignal('seo.description', {}, { scope: 'joinTheParty' });

  private readonly _applySeo = effect(() => {
    this.seo.apply({
      title: this.seoTitle() || 'Dołącz do Drużyny',
      description: this.seoDescription() || '',
    });
  });

  // ============
  // helper: section { title, subtitle }
  // ============
  private sectionTitleSubtitle(key: string): Signal<{ title: string; subtitle: string }> {
    const dict = translateObjectSignal(key, {}, { scope: 'joinTheParty' });
    return pickTranslations(dict as any, TITLE_SUBTITLE);
  }

  // ============
  // hero + CTA
  // ============
  private readonly heroDict = translateObjectSignal('hero', {}, { scope: 'joinTheParty' });
  private readonly commonCtaDict = translateObjectSignal('cta', {}, { scope: 'common' });

  readonly hero = pickTranslations(this.heroDict, ['badge', 'title', 'subtitle'] as const);

  readonly cta = pickTranslations(this.commonCtaDict, ['contactUs', 'joinProgram'] as const);

  // ============
  // title/subtitle sections (no repetition)
  // ============
  readonly intro = this.sectionTitleSubtitle('intro');
  readonly structure = this.sectionTitleSubtitle('structure');
  readonly continuation = this.sectionTitleSubtitle('continuation');
  readonly orgMeeting = this.sectionTitleSubtitle('orgMeeting');

  // ============
  // lists
  // ============
  private readonly benefitsDict = translateObjectSignal('intro.benefits', {}, { scope: 'joinTheParty' });
  private readonly stepsDict = translateObjectSignal('structure.steps', {}, { scope: 'joinTheParty' });
  private readonly rulesDict = translateObjectSignal('structure.rules', {}, { scope: 'joinTheParty' });
  private readonly continuationBulletsDict = translateObjectSignal('continuation.bullets', {}, { scope: 'joinTheParty' });
  private readonly orgMeetingBulletsDict = translateObjectSignal('orgMeeting.bullets', {}, { scope: 'joinTheParty' });

  private readonly benefitIcons: IconTech[] = [
    { id: 1, icon: 'pi pi-users' },
    { id: 2, icon: 'pi pi-calendar' },
    { id: 3, icon: 'pi pi-star' },
    { id: 4, icon: 'pi pi-shield' },
  ];

  private readonly stepIcons: IconTech[] = [
    { id: 1, icon: 'pi pi-comments' },
    { id: 2, icon: 'pi pi-sitemap' },
    { id: 3, icon: 'pi pi-play' },
    { id: 4, icon: 'pi pi-compass' },
  ];

  readonly benefits = computed(() => {
    const list = toSortedById<{ id: number; title: string; text: string }>(this.benefitsDict());
    return withIcons(list, this.benefitIcons);
  });

  readonly steps = computed(() => {
    const list = toSortedById<{ id: number; title: string; text: string }>(this.stepsDict());
    return withIcons(list, this.stepIcons);
  });

  readonly rules = computed(() => numberedDictToStringArray(this.rulesDict() as any));
  readonly continuationBullets = computed(() => numberedDictToStringArray(this.continuationBulletsDict() as any));
  readonly orgMeetingBullets = computed(() => numberedDictToStringArray(this.orgMeetingBulletsDict() as any));

  trackByIndex = (i: number) => i;
}
