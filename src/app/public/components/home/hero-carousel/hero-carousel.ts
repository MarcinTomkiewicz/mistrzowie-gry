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

import { ButtonModule } from 'primeng/button';

import {
  provideTranslocoScope,
  TranslocoService,
  translateObjectSignal,
  translateSignal,
} from '@jsverse/transloco';

import { Platform } from '../../../../core/services/platform/platform';
import { IHeroSlide } from '../../../../core/interfaces/home/i-hero-slide';
import {
  dictToSortedArray,
  numberedDictToStringArray,
} from '../../../../core/utils/dict-to-sorted-array';

type HeroSlideCopy = {
  id: number;
  heading: string;
  text: string;     // (string), ale zostawiamy furtkę na paragraphs gdybyś chciał
  ctaLabel: string;
};

@Component({
  selector: 'app-hero-carousel',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './hero-carousel.html',
  styleUrl: './hero-carousel.scss',
  providers: [provideTranslocoScope('home')],
})
export class HeroCarousel implements OnInit, OnDestroy {
  private readonly platform = inject(Platform);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  readonly slides = signal<IHeroSlide[]>([
    {
      heading: '',
      text: '',
      ctaLabel: '',
      ctaPath: '/offer/individual',
      imageSrc: 'hero/hero-1.png',
      imageAlt: 'Sesja RPG prowadzona przy stole',
    },
    {
      heading: '',
      text: '',
      ctaLabel: '',
      ctaPath: '/chaotic-thursdays',
      imageSrc: 'hero/hero-2.png',
      imageAlt: 'Kostki RPG i notatki na stole',
    },
    {
      heading: '',
      text: '',
      ctaLabel: '',
      ctaPath: '/join',
      imageSrc: 'hero/hero-3.png',
      imageAlt: 'Grupa osób grających w RPG',
    },
    {
      heading: '',
      text: '',
      ctaLabel: '',
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
    // MVP: jeśli globalnie ustawiasz język gdzie indziej, usuń to stąd
    this.transloco.setActiveLang('pl');
    this.tryStartAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  // ======================
  // i18n (signals)
  // ======================

  readonly ariaSectionLabel = translateSignal('heroCarousel.aria.sectionLabel', {}, { scope: 'home' });
  readonly ariaPrev = translateSignal('heroCarousel.aria.prev', {}, { scope: 'home' });
  readonly ariaNext = translateSignal('heroCarousel.aria.next', {}, { scope: 'home' });
  readonly ariaDots = translateSignal('heroCarousel.aria.dots', {}, { scope: 'home' });
  readonly ariaGoToPrefix = translateSignal('heroCarousel.aria.goToSlidePrefix', {}, { scope: 'home' });

  readonly slidesCopyDict = translateObjectSignal('heroCarousel.slides', {}, { scope: 'home' });

  readonly slidesCopy = computed(() => {
    const dict = this.slidesCopyDict();
    return dictToSortedArray<HeroSlideCopy>(dict, (item) => Number(item?.id ?? 0)).map((x) => ({
      id: Number((x as any)?.id ?? 0),
      heading: String((x as any)?.heading ?? ''),
      // jeśli kiedyś zrobisz text jako paragraphs: { "1": "...", "2": "..." }
      // to tu możesz zrobić join:
      // text: numberedDictToStringArray((x as any)?.text).join(' ')
      text: String((x as any)?.text ?? ''),
      ctaLabel: String((x as any)?.ctaLabel ?? ''),
    }));
  });

  readonly activeCopy = computed(() => {
    const list = this.slidesCopy();
    const idx = this.activeIndex();
    return list[Math.max(0, Math.min(idx, list.length - 1))] ?? null;
  });

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
  // CTA CARDS
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

  dotAriaLabel(goToSlidePrefix: string, index: number): string {
    return `${goToSlidePrefix} ${index + 1}`;
  }
}
