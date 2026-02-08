import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { Platform } from '../../../../core/services/platform/platform';
import { IHeroSlide } from '../../../../core/interfaces/home/i-hero-slide';

import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-hero-carousel',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './hero-carousel.html',
  styleUrl: './hero-carousel.scss',
})
export class HeroCarousel implements OnInit, OnDestroy {
  private readonly platform = inject(Platform);
  private readonly router = inject(Router);

  readonly slides = signal<IHeroSlide[]>([
    {
      heading: 'Poznaj Mistrzów Gry',
      text: 'Projektujemy i prowadzimy doświadczenia RPG — dla ludzi, grup i organizacji.',
      ctaLabel: 'Zobacz ofertę',
      ctaPath: '/offer/individual',
      imageSrc: 'hero/hero-1.png',
      imageAlt: 'Sesja RPG prowadzona przy stole',
    },
    {
      heading: 'Chaotyczne Czwartki',
      text: 'Cotygodniowe wydarzenie — losujemy stoły, ekipy i systemy. Wpadasz i grasz.',
      ctaLabel: 'Sprawdź szczegóły',
      ctaPath: '/chaotic-thursdays',
      imageSrc: 'hero/hero-2.png',
      imageAlt: 'Kostki RPG i notatki na stole',
    },
    {
      heading: 'Dołącz do Drużyny',
      text: 'Program dla tych, którzy chcą znaleźć ekipę i wejść w regularne granie.',
      ctaLabel: 'Zobacz program',
      ctaPath: '/join',
      imageSrc: 'hero/hero-3.png',
      imageAlt: 'Grupa osób grających w RPG',
    },
    {
      heading: 'Oferta dla firm i instytucji',
      text: 'RPG jako narzędzie integracji i rozwoju — projektujemy scenariusze pod cele grupy.',
      ctaLabel: 'Poznaj ofertę',
      ctaPath: '/offer/business',
      imageSrc: 'hero/hero-4.png',
      imageAlt: 'Spotkanie zespołu przy stole',
    },
  ]);

  readonly activeIndex = signal(0);

  readonly active = computed(() => {
    const list = this.slides();
    const idx = this.activeIndex();
    return list[Math.max(0, Math.min(idx, list.length - 1))];
  });

  private intervalId: number | null = null;
  private userPaused = false;

  ngOnInit(): void {
    this.tryStartAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  // ======================
  // AUTOPLAY
  // ======================

  private tryStartAutoplay(): void {
    if (!this.platform.isBrowser) return;

    const win = this.platform.window;
    if (!win) return;

    const prefersReducedMotion =
      win.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    if (prefersReducedMotion) return;

    if (this.slides().length <= 1) return;

    this.intervalId = win.setInterval(() => {
      if (this.userPaused) return;
      this.next();
    }, 10_000);
  }

  private stopAutoplay(): void {
    if (!this.platform.isBrowser) return;
    const win = this.platform.window;
    if (!win) return;

    if (this.intervalId !== null) {
      win.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  onMouseEnter(): void {
    this.userPaused = true;
  }

  onMouseLeave(): void {
    this.userPaused = false;
  }

  onFocusIn(): void {
    this.userPaused = true;
  }

  onFocusOut(): void {
    this.userPaused = false;
  }

  // ======================
  // NAV
  // ======================

  prev(): void {
    this.userPaused = true;
    const len = this.slides().length;
    if (!len) return;
    this.activeIndex.set((this.activeIndex() - 1 + len) % len);
  }

  next(): void {
    const len = this.slides().length;
    if (!len) return;
    this.activeIndex.set((this.activeIndex() + 1) % len);
  }

  goTo(index: number): void {
    this.userPaused = true;
    const len = this.slides().length;
    if (!len) return;
    this.activeIndex.set(Math.max(0, Math.min(index, len - 1)));
  }

  // ======================
  // CTA CARDS (clickable divs)
  // ======================

  onCtaNavigate(path: string): void {
    this.router.navigateByUrl(path);
  }

  onCtaKeydown(event: KeyboardEvent, path: string): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onCtaNavigate(path);
      return;
    }

    if (event.key === ' ' || event.code === 'Space') {
      event.preventDefault();
      this.onCtaNavigate(path);
    }
  }

  trackByIndex = (i: number) => i;
  trackByCtaPath = (_: number, item: IHeroSlide) => item.ctaPath;
}
