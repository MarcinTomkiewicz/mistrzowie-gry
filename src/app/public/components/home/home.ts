import { Component, inject } from '@angular/core';

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
  readonly theme = inject(Theme);

  onThemeToggle(): void {
    this.theme.toggle();
  }
}
