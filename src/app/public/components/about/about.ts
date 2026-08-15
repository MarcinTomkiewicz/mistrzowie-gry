import { Component, effect, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { ButtonModule } from 'primeng/button';

import { provideTranslocoScope } from '@jsverse/transloco';

import { buildSiteUrl } from '../../../core/config/site';
import { Seo } from '../../../core/services/seo/seo';
import { createPageStructuredData } from '../../../core/utils/structured-data';
import { InternalLinkText } from '../../../common/internal-link-text/internal-link-text';
import { createAboutI18n } from './about.i18n';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [
    RouterModule,
    ButtonModule,
    AnimateOnScrollModule,
    InternalLinkText,
  ],
  templateUrl: './about.html',
  styleUrl: './about.scss',
  providers: [provideTranslocoScope('common', 'about')],
})
export class About {
  private readonly seo = inject(Seo);
  private readonly pageUrl = buildSiteUrl('/about');

  readonly i18n = createAboutI18n();

  constructor() {
    effect(() => {
      const seo = this.i18n.seo();

      this.seo.apply({
        title: seo.title,
        description: seo.description,
        canonicalUrl: this.pageUrl,
        structuredData: createPageStructuredData({
          type: 'AboutPage',
          id: `${this.pageUrl}#webpage`,
          url: this.pageUrl,
          name: seo.title,
          description: seo.description,
        }),
      });
    });
  }

  readonly hero = this.i18n.hero;
  readonly sections = this.i18n.sections;
  readonly cards = this.i18n.cards;
  readonly commonNav = this.i18n.commonNav;

  trackByIndex = (i: number): number => i;
}
