import {
  afterNextRender,
  AfterRenderRef,
  Component,
  inject,
  signal,
} from '@angular/core';

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

  private readonly afterRenderRef: AfterRenderRef;

  readonly isLightTheme = signal(false);

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

    this.afterRenderRef = afterNextRender(() => {
      this.syncThemeFromDom();
    });
  }

  ngOnDestroy(): void {
    this.afterRenderRef.destroy();
  }

  onThemeToggle(): void {
    this.applyTheme(this.isLightTheme() ? 'light' : 'dark');
  }

  private syncThemeFromDom(): void {
    const root = document.documentElement;
    this.isLightTheme.set(root.getAttribute('data-theme') === 'light');
  }

  private applyTheme(theme: 'dark' | 'light'): void {
    const root = document.documentElement;

    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
      this.isLightTheme.set(true);
      return;
    }

    root.removeAttribute('data-theme');
    this.isLightTheme.set(false);
  }
}