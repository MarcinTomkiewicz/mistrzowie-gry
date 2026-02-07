import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
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

  readonly slides = signal<IHeroSlide[]>([
    {
      heading: 'Poznaj Mistrzów Gry',
      text: 'Projektujemy i prowadzimy doświadczenia RPG — dla ludzi, grup i organizacji.',
      ctaLabel: 'Zobacz ofertę',
      ctaPath: '/offer/individual',
      imageSrc: 'assets/hero/hero-1.jpg',
      imageAlt: 'Sesja RPG prowadzona przy stole',
    },
    {
      heading: 'Chaotyczne Czwartki',
      text: 'Cotygodniowe wydarzenie — losujemy stoły, ekipy i systemy. Wpadasz i grasz.',
      ctaLabel: 'Sprawdź szczegóły',
      ctaPath: '/chaotic-thursdays',
      imageSrc: 'assets/hero/hero-2.jpg',
      imageAlt: 'Kostki RPG i notatki na stole',
    },
    {
      heading: 'Dołącz do Drużyny',
      text: 'Program dla tych, którzy chcą znaleźć ekipę i wejść w regularne granie.',
      ctaLabel: 'Zobacz program',
      ctaPath: '/join',
      imageSrc: 'assets/hero/hero-3.jpg',
      imageAlt: 'Grupa osób grających w RPG',
    },
    {
      heading: 'Oferta dla firm i instytucji',
      text: 'RPG jako narzędzie integracji i rozwoju — projektujemy scenariusze pod cele grupy.',
      ctaLabel: 'Poznaj ofertę',
      ctaPath: '/offer/business',
      imageSrc: 'assets/hero/hero-4.jpg',
      imageAlt: 'Spotkanie zespołu przy stole',
    },
  ]);

  readonly activeIndex = signal(0);

  readonly active = computed(() => {
    const list = this.slides();
    const idx = this.activeIndex();
    return list[Math.max(0, Math.min(idx, list.length - 1))];
  });

  /** Autoplay kontrolowany i “uprzejmy”. */
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

    // Respect user motion preferences
    const prefersReducedMotion = win.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    if (prefersReducedMotion) return;

    // Jeśli jest tylko 1 slajd, autoplay nie ma sensu
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
    const nextIndex = (this.activeIndex() - 1 + len) % len;
    this.activeIndex.set(nextIndex);
  }

  next(): void {
    const len = this.slides().length;
    if (!len) return;
    const nextIndex = (this.activeIndex() + 1) % len;
    this.activeIndex.set(nextIndex);
  }

  goTo(index: number): void {
    this.userPaused = true;
    const len = this.slides().length;
    if (!len) return;
    const clamped = Math.max(0, Math.min(index, len - 1));
    this.activeIndex.set(clamped);
  }

  trackByIndex = (i: number) => i;
}
