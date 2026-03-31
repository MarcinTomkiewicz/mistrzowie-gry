import { Component, inject } from '@angular/core';

import {
  createOrganizationStructuredData,
  createWebsiteStructuredData,
  SOCIAL_SHARE_IMAGE,
} from './core/config/site';
import { Seo } from './core/services/seo/seo';
import { AppShell } from './public/components/app-shell/app-shell';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppShell],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly seo = inject(Seo);
  private readonly socialShareImage = SOCIAL_SHARE_IMAGE;

  constructor() {
    this.seo.apply({
      title: 'Gry fabularne na wyciągnięcie ręki - Mistrzowie Gry',
      description:
        'Nie przejmuj się brakiem Mistrza Gry ani czytaniem podręczników. Organizujemy sesje RPG dla początkujących, prowadzimy gry fabularne, pomagamy zacząć grać i znaleźć drużynę.',
      og: {
        type: 'website',
        images: [
          {
            url: this.socialShareImage,
            width: 1200,
            height: 1200,
            alt: 'Mistrzowie Gry',
            type: 'image/jpeg',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        image: this.socialShareImage,
      },
      structuredData: [
        createOrganizationStructuredData(),
        createWebsiteStructuredData(),
      ],
    });
  }
}
