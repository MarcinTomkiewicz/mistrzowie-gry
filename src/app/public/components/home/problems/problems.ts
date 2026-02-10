import { CommonModule } from '@angular/common';
import { Component, computed } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { provideTranslocoScope, translateObjectSignal } from '@jsverse/transloco';

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
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './problems.html',
  styleUrl: './problems.scss',
  providers: [provideTranslocoScope('home'), provideTranslocoScope('common')],
})
export class Problems {
  // developer-owned (routing/icons + which common CTA label to use)
  private readonly tech: ProblemCardTech[] = [
    { id: 1, ctaPath: '/join-the-party', icon: 'pi pi-users', ctaKey: 'joinProgram' },
    {
      id: 2,
      ctaPath: '/offer/individual',
      icon: 'pi pi-user-edit',
      ctaKey: 'offerIndividual',
    },
    {
      id: 3,
      ctaPath: '/chaotic-thursdays',
      icon: 'pi pi-calendar',
      ctaKey: 'chaoticThursdays',
    },
    {
      id: 4,
      ctaPath: '/offer/business',
      icon: 'pi pi-building',
      ctaKey: 'offerBusiness',
    },
  ];

  // copywriter-owned (home.json)
  private readonly headerDict = translateObjectSignal(
    'problems.header',
    {},
    { scope: 'home' },
  );
  private readonly cardsDict = translateObjectSignal(
    'problems.cards',
    {},
    { scope: 'home' },
  );

  // common CTA labels
  private readonly ctaDict = translateObjectSignal('cta', {}, { scope: 'common' });
  private readonly cta = pickTranslations(this.ctaDict, [
    'joinProgram',
    'offerIndividual',
    'chaoticThursdays',
    'offerBusiness',
  ] as const);

  readonly header = pickTranslations(this.headerDict, ['title', 'subtitle'] as const);

  readonly items = computed<UiProblemCard[]>(() => {
    const dict = this.cardsDict();
    const copyList = dictToSortedArray<ProblemCardCopy>(dict as any, (item) =>
      Number((item as any)?.id ?? 0),
    ).map((x) => ({
      id: Number((x as any)?.id ?? 0),
      title: String((x as any)?.title ?? ''),
      text: String((x as any)?.text ?? ''),
    }));

    const techById = new Map<number, ProblemCardTech>(
      this.tech.map((t) => [t.id, t]),
    );

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

  trackById = (_: number, item: UiProblemCard) => item.id;
}
