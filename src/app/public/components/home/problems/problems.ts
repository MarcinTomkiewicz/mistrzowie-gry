import { Component, computed } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { provideTranslocoScope } from '@jsverse/transloco';

import { IProblemCard } from '../../../../core/interfaces/home/i-problem-card';
import { PROBLEMS_TECH_BY_ID } from './problems.config';
import { createProblemsI18n } from './problems.i18n';

type UiProblemCard = IProblemCard & { id: number };

@Component({
  selector: 'app-problems',
  standalone: true,
  imports: [RouterModule, ButtonModule],
  templateUrl: './problems.html',
  styleUrl: './problems.scss',
  providers: [provideTranslocoScope('home', 'common')],
})
export class Problems {
  readonly i18n = createProblemsI18n();

  readonly header = this.i18n.header;

  readonly items = computed<UiProblemCard[]>(() => {
    const copyList = this.i18n.cardsCopy();
    const cta = this.i18n.cta();

    return copyList
      .map((copy) => {
        const tech = PROBLEMS_TECH_BY_ID.get(copy.id);
        if (!tech) return null;

        return {
          id: copy.id,
          title: copy.title,
          text: copy.text,
          ctaLabel: cta[tech.ctaKey] ?? '',
          ctaPath: tech.ctaPath,
          icon: tech.icon,
        } satisfies UiProblemCard;
      })
      .filter((item): item is UiProblemCard => !!item);
  });

  trackById = (_: number, item: UiProblemCard): number => item.id;
}