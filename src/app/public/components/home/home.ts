import { Component, effect, inject } from '@angular/core';

import { provideTranslocoScope } from '@jsverse/transloco';

import {
  buildSiteUrl,
  createOrganizationStructuredData,
  createWebsiteStructuredData,
  SITE_NAME,
  SOCIAL_SHARE_IMAGE,
} from '../../../core/config/site';
import { Seo } from '../../../core/services/seo/seo';
import { createCommonSeoI18n } from '../../../core/translations/common.i18n';
import { HeroCarousel } from './hero-carousel/hero-carousel';
import { Problems } from './problems/problems';
import { Programs } from './programs/programs';
import { SeoRichText } from './seo-rich-text/seo-rich-text';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeroCarousel, Problems, Programs, SeoRichText],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  providers: [provideTranslocoScope('common')],
})
export class Home {
  private readonly seo = inject(Seo);
  private readonly pageUrl = buildSiteUrl('/');
  private readonly commonSeo = createCommonSeoI18n();

  private readonly applySeoEffect = effect(() => {
    const seo = this.commonSeo();

    this.seo.apply({
      title: seo.defaultTitle,
      description: seo.defaultDescription,
      canonicalUrl: this.pageUrl,
      og: {
        type: 'website',
        images: [
          {
            url: SOCIAL_SHARE_IMAGE,
            width: 1200,
            height: 1200,
            alt: SITE_NAME,
            type: 'image/jpeg',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        image: SOCIAL_SHARE_IMAGE,
      },
      structuredData: [
        createOrganizationStructuredData(),
        createWebsiteStructuredData(),
      ],
    });
  });
}
