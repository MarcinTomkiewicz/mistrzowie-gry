import { Component, inject } from '@angular/core';


import { Seo } from '../../../core/services/seo/seo';
import { Theme } from '../../../core/services/theme/theme';
import { HeroCarousel } from './hero-carousel/hero-carousel';
import { Problems } from './problems/problems';
import { Programs } from './programs/programs';
import { SeoRichText } from './seo-rich-text/seo-rich-text';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeroCarousel, Problems, Programs, SeoRichText],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly seo = inject(Seo);
  readonly theme = inject(Theme);

  constructor() {
    this.seo.apply({
      title: 'Gry fabularne na wyciągnięcie ręki - Mistrzowie Gry',
      description:
        'Nie przejmuj się brakiem Mistrza Gry ani czytaniem podręczników. Organizujemy sesje RPG dla początkujących, prowadzimy gry fabularne, pomagamy zacząć grać i znaleźć drużynę.',
      og: {
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
      },
    });
  }

  onThemeToggle(): void {
    this.theme.toggle();
  }
}
