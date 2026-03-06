import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  AfterRenderRef,
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
  afterNextRender,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import {
  TranslocoService,
  provideTranslocoScope,
  translateObjectSignal,
  translateSignal,
} from '@jsverse/transloco';

import { IHeroSlide } from '../../../../core/interfaces/home/i-hero-slide';
import { dictToSortedArray } from '../../../../core/utils/dict-to-sorted-array';

type HeroSlideCopy = {
  id: number;
  heading: string;
  text: string;
  ctaLabel: string;
};

function toSortedById<T>(dict: unknown): T[] {
  return dictToSortedArray<T>(dict as never, (x) =>
    Number((x as { id?: number })?.id ?? 0),
  );
}

@Component({
  selector: 'app-hero-carousel',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, NgOptimizedImage],
  templateUrl: './hero-carousel.html',
  styleUrl: './hero-carousel.scss',
  providers: [provideTranslocoScope('home')],
})
export class HeroCarousel implements OnDestroy {
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  private readonly slides = signal<IHeroSlide[]>([
    {
      heading: '',
      text: '',
      ctaLabel: '',
      ctaPath: '/offer/oferta-indywidualna',
      imageSrc: 'hero/hero-1.avif',
      imageAlt: '',
    },
    {
      heading: '',
      text: '',
      ctaLabel: '',
      ctaPath: '/chaotic-thursdays',
      imageSrc: 'hero/hero-2.avif',
      imageAlt: '',
    },
    {
      heading: '',
      text: '',
      ctaLabel: '',
      ctaPath: '/join-the-party',
      imageSrc: 'hero/hero-3.png',
      imageAlt: '',
    },
    {
      heading: '',
      text: '',
      ctaLabel: '',
      ctaPath: '/offer/oferta-biznesowa',
      imageSrc: 'hero/hero-4.avif',
      imageAlt: '',
    },
  ]);

  private readonly activeIndex = signal(0);

  private readonly active = computed(() => {
    const list = this.slides();
    const idx = this.activeIndex();

    if (!list.length) {
      return {
        heading: '',
        text: '',
        ctaLabel: '',
        ctaPath: '',
        imageSrc: '',
        imageAlt: '',
      };
    }

    return (
      list[Math.max(0, Math.min(idx, list.length - 1))] ?? {
        heading: '',
        text: '',
        ctaLabel: '',
        ctaPath: '',
        imageSrc: '',
        imageAlt: '',
      }
    );
  });

  private intervalId: number | null = null;
  private userPaused = false;
  private readonly afterRenderRef: AfterRenderRef;

  constructor() {
    this.transloco.setActiveLang('pl');

    this.afterRenderRef = afterNextRender(() => {
      this.tryStartAutoplay();
    });
  }

  ngOnDestroy(): void {
    this.afterRenderRef.destroy();
    this.stopAutoplay();
  }

  // ======================
  // i18n (signals)
  // ======================

  private readonly ariaSectionLabel = translateSignal(
    'heroCarousel.aria.sectionLabel',
    {},
    { scope: 'home' },
  );

  private readonly ariaPrev = translateSignal(
    'heroCarousel.aria.prev',
    {},
    { scope: 'home' },
  );

  private readonly ariaNext = translateSignal(
    'heroCarousel.aria.next',
    {},
    { scope: 'home' },
  );

  private readonly ariaDots = translateSignal(
    'heroCarousel.aria.dots',
    {},
    { scope: 'home' },
  );

  private readonly ariaGoToPrefix = translateSignal(
    'heroCarousel.aria.goToSlidePrefix',
    {},
    { scope: 'home' },
  );

  private readonly slidesCopyDict = translateObjectSignal(
    'heroCarousel.slides',
    {},
    { scope: 'home' },
  );

  private readonly slidesCopy = computed<HeroSlideCopy[]>(() => {
    const dictList = toSortedById<HeroSlideCopy>(this.slidesCopyDict());
    const byId = new Map<number, HeroSlideCopy>(
      dictList.map((x) => [Number(x.id ?? 0), x]),
    );

    return this.slides().map((_, i) => {
      const id = i + 1;
      const t = byId.get(id);

      return {
        id,
        heading: String(t?.heading ?? ''),
        text: String(t?.text ?? ''),
        ctaLabel: String(t?.ctaLabel ?? ''),
      };
    });
  });

  private readonly activeCopy = computed(() => {
    const list = this.slidesCopy();
    const idx = this.activeIndex();

    return list[Math.max(0, Math.min(idx, list.length - 1))] ?? null;
  });

  // ======================
  // VM (single access point)
  // ======================

  readonly vm = computed(() => {
    const slides = this.slides();
    const copyList = this.slidesCopy();
    const active = this.active();
    const activeCopy = this.activeCopy();
    const activeIndex = this.activeIndex();

    return {
      slides,
      copyList,
      active,
      activeCopy,
      aria: {
        sectionLabel: this.ariaSectionLabel() || 'Wprowadzenie do usług RPG',
        prev: this.ariaPrev() || 'Poprzedni slajd',
        next: this.ariaNext() || 'Następny slajd',
        dots: this.ariaDots() || 'Wybór slajdu',
        goToPrefix: this.ariaGoToPrefix() || 'Przejdź do slajdu',
      },
      activeIndex,
      isFirstSlide: activeIndex === 0,
    };
  });

  // ======================
  // AUTOPLAY
  // ======================

  private tryStartAutoplay(): void {
    const prefersReducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

    if (prefersReducedMotion) return;
    if (this.slides().length <= 1) return;
    if (this.intervalId !== null) return;

    this.intervalId = window.setInterval(() => {
      if (this.userPaused) return;
      this.next();
    }, 10_000);
  }

  private stopAutoplay(): void {
    if (this.intervalId === null) return;

    window.clearInterval(this.intervalId);
    this.intervalId = null;
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
    void this.router.navigateByUrl(path);
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

  trackByIndex = (i: number): number => i;

  trackByCtaPath = (_: number, item: IHeroSlide): string => item.ctaPath;

  dotAriaLabel(goToSlidePrefix: string, index: number): string {
    return `${goToSlidePrefix} ${index + 1}`;
  }
}