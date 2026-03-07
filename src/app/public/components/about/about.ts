import { Component, effect, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { provideTranslocoScope } from '@jsverse/transloco';

import { Seo } from '../../../core/services/seo/seo';
import { createAboutI18n } from './about.i18n';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterModule, ButtonModule],
  templateUrl: './about.html',
  styleUrl: './about.scss',
  providers: [provideTranslocoScope('common', 'about')],
})
export class About {
  private readonly seo = inject(Seo);
  readonly i18n = createAboutI18n();

  constructor() {
    effect(() => {
      const seo = this.i18n.seo();

      this.seo.apply({
        title: seo.title,
        description: seo.description,
      });
    });
  }

  readonly hero = this.i18n.hero;
  readonly sections = this.i18n.sections;
  readonly cards = this.i18n.cards;
  readonly commonCta = this.i18n.commonCta;

  trackByIndex = (i: number): number => i;
}