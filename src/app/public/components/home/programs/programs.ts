import { CommonModule } from '@angular/common';
import { Component, computed } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { provideTranslocoScope, translateObjectSignal } from '@jsverse/transloco';

import { IProgramCard } from '../../../../core/interfaces/home/i-program-card';
import {
  dictToSortedArray,
  numberedDictToStringArray,
} from '../../../../core/utils/dict-to-sorted-array';
import { pickTranslations } from '../../../../core/utils/pick-translation';

type ProgramsCardCopy = {
  id: number;
  title: string;
  intro: string;
  bullets: Record<string, string>;
};

type CtaKey = 'checkDetails' | 'seeProgram';

type ProgramsCardTech = {
  id: number;
  ctaPath: string;
  ctaKey: CtaKey;
};

type UiProgramCard = IProgramCard & { id: number };

@Component({
  selector: 'app-programs',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './programs.html',
  styleUrl: './programs.scss',
  providers: [provideTranslocoScope('home'), provideTranslocoScope('common')],
})
export class Programs {
  // developer-owned (routing + which common CTA label to use)
  private readonly tech: ProgramsCardTech[] = [
    { id: 1, ctaPath: '/chaotic-thursdays', ctaKey: 'checkDetails' },
    { id: 2, ctaPath: '/join', ctaKey: 'seeProgram' },
  ];

  // copywriter-owned (home.json)
  private readonly headerDict = translateObjectSignal(
    'programs.header',
    {},
    { scope: 'home' },
  );
  private readonly cardsDict = translateObjectSignal(
    'programs.cards',
    {},
    { scope: 'home' },
  );

  // common CTA labels
  private readonly ctaDict = translateObjectSignal('cta', {}, { scope: 'common' });
  private readonly cta = pickTranslations(this.ctaDict, ['checkDetails', 'seeProgram'] as const);

  readonly header = pickTranslations(this.headerDict, ['title', 'subtitle'] as const);

  readonly programs = computed<UiProgramCard[]>(() => {
    const dict = this.cardsDict();

    const copyList = dictToSortedArray<ProgramsCardCopy>(dict as any, (item) =>
      Number((item as any)?.id ?? 0),
    ).map((x) => ({
      id: Number((x as any)?.id ?? 0),
      title: String((x as any)?.title ?? ''),
      intro: String((x as any)?.intro ?? ''),
      bullets: ((x as any)?.bullets ?? {}) as Record<string, string>,
    }));

    const techById = new Map<number, ProgramsCardTech>(
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
          intro: c.intro,
          bullets: numberedDictToStringArray(c.bullets),
          ctaLabel: cta[t.ctaKey] ?? '',
          ctaPath: t.ctaPath,
        } satisfies UiProgramCard;
      })
      .filter((x): x is UiProgramCard => !!x);
  });

  trackById = (_: number, item: UiProgramCard) => item.id;
  trackByBullet = (_: number, bullet: string) => bullet;
}
