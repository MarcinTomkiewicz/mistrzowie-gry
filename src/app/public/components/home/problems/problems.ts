import { Component, computed } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import {
  provideTranslocoScope,
  translateObjectSignal,
} from '@jsverse/transloco';

import { IProblemCard } from '../../../../core/interfaces/home/i-problem-card';
import { dictToSortedArray } from '../../../../core/utils/dict-to-sorted-array';
import { pickTranslations } from '../../../../core/utils/pick-translation';

type ProblemCardCopy = {
  id: number;
  title: string;
  text: string;
};

type CtaKey =
  | 'joinProgram'
  | 'offerIndividual'
  | 'chaoticThursdays'
  | 'offerBusiness';

type ProblemCardTech = {
  id: number;
  ctaPath: string;
  icon: string;
  ctaKey: CtaKey;
};

type UiProblemCard = IProblemCard & { id: number };

@Component({
  selector: 'app-problems',
  standalone: true,
  imports: [RouterModule, ButtonModule],
  templateUrl: './problems.html',
  styleUrl: './problems.scss',
  providers: [provideTranslocoScope('home'), provideTranslocoScope('common')],
})
export class Problems {
  // developer-owned (routing/icons + which common CTA label to use)
  private readonly tech: ProblemCardTech[] = [
    { id: 1, ctaPath: '/join-the-party', icon: 'pi pi-uprising', ctaKey: 'joinProgram' },
    { id: 2, ctaPath: '/offer/oferta-indywidualna', icon: 'pi pi-read', ctaKey: 'offerIndividual' },
    { id: 3, ctaPath: '/chaotic-thursdays', icon: 'pi pi-evil-book', ctaKey: 'chaoticThursdays' },
    { id: 4, ctaPath: '/offer/oferta-biznesowa', icon: 'pi pi-teacher', ctaKey: 'offerBusiness' },
  ];

  // copywriter-owned (home.json)
  private readonly headerDict = translateObjectSignal('problems.header', {}, { scope: 'home' });
  private readonly cardsDict = translateObjectSignal('problems.cards', {}, { scope: 'home' });

  // common CTA labels
  private readonly ctaDict = translateObjectSignal('cta', {}, { scope: 'common' });
  private readonly cta = pickTranslations(this.ctaDict, [
    'joinProgram',
    'offerIndividual',
    'chaoticThursdays',
    'offerBusiness',
  ] as const);

  private readonly header = pickTranslations(this.headerDict, ['title', 'subtitle'] as const);

  private readonly items = computed<UiProblemCard[]>(() => {
    const copyList = dictToSortedArray<ProblemCardCopy>(
      this.cardsDict() as any,
      (item) => Number((item as any)?.id ?? 0),
    ).map((x) => ({
      id: Number((x as any)?.id ?? 0),
      title: String((x as any)?.title ?? ''),
      text: String((x as any)?.text ?? ''),
    }));

    const techById = new Map<number, ProblemCardTech>(this.tech.map((t) => [t.id, t]));
    const cta = this.cta();

    return copyList
      .map((c) => {
        const t = techById.get(c.id);
        if (!t) return null;

        return {
          id: c.id,
          title: c.title,
          text: c.text,
          ctaLabel: cta[t.ctaKey] ?? '',
          ctaPath: t.ctaPath,
          icon: t.icon,
        } satisfies UiProblemCard;
      })
      .filter((x): x is UiProblemCard => !!x);
  });

  readonly vm = computed(() => ({
    header: this.header(),
    items: this.items(),
  }));

  trackById = (_: number, item: UiProblemCard) => item.id;
}