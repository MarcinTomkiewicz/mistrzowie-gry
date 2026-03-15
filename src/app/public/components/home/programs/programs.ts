import { Component, computed } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { provideTranslocoScope } from '@jsverse/transloco';

import { IProgramCard } from '../../../../core/interfaces/home/i-program-card';
import { PROGRAMS_TECH_BY_ID } from './programs.config';
import { createProgramsI18n } from './programs.i18n';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';

type UiProgramCard = IProgramCard & { id: number };

@Component({
  selector: 'app-programs',
  standalone: true,
  imports: [RouterModule, ButtonModule, AnimateOnScrollModule],
  templateUrl: './programs.html',
  styleUrl: './programs.scss',
  providers: [provideTranslocoScope('home', 'common')],
})
export class Programs {
  readonly i18n = createProgramsI18n();

  readonly header = this.i18n.header;

  readonly programs = computed<UiProgramCard[]>(() => {
    const copyList = this.i18n.cardsCopy();
    const cta = this.i18n.cta();

    return copyList
      .map((copy) => {
        const tech = PROGRAMS_TECH_BY_ID.get(copy.id);
        if (!tech) return null;

        return {
          id: copy.id,
          title: copy.title,
          intro: copy.intro,
          bullets: copy.bullets,
          ctaLabel: cta[tech.ctaKey] ?? '',
          ctaPath: tech.ctaPath,
        } satisfies UiProgramCard;
      })
      .filter((item): item is UiProgramCard => !!item);
  });

  trackById = (_: number, item: UiProgramCard): number => item.id;
  trackByBullet = (_: number, bullet: string): string => bullet;
}