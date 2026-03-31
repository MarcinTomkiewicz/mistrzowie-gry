import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { provideTranslocoScope } from '@jsverse/transloco';

import { Platform } from '../../../../core/services/platform/platform';
import { createHeroCarouselI18n, UiHeroSlide } from './hero-carousel.i18n';
import { HERO_SLIDES_TECH_BY_ID } from './hero-carousel.config';

@Component({
  selector: 'app-hero-carousel',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, NgOptimizedImage],
  templateUrl: './hero-carousel.html',
  styleUrl: './hero-carousel.scss',
  providers: [provideTranslocoScope('home')],
})
export class HeroCarousel {
  private readonly platform = inject(Platform);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly i18n = createHeroCarouselI18n();

  readonly activeIndex = signal(0);
  readonly userPaused = signal(false);

  private intervalId: number | null = null;

  constructor() {
    this.platform.onIdle(() => {
      this.tryStartAutoplay();
    }, 1_500);

    this.destroyRef.onDestroy(() => this.stopAutoplay());
  }

  readonly slides = computed<UiHeroSlide[]>(() => {
    const copyList = this.i18n.slidesCopy();
    const techById = HERO_SLIDES_TECH_BY_ID;

    return copyList
      .map((copy) => {
        const tech = techById.get(copy.id);
        if (!tech) return null;

        return {
          id: copy.id,
          heading: copy.heading,
          text: copy.text,
          ctaLabel: copy.ctaLabel,
          ctaPath: tech.ctaPath,
          imageSrc: tech.imageSrc,
          imageAlt: tech.imageAlt,
        } satisfies UiHeroSlide;
      })
      .filter((slide): slide is UiHeroSlide => !!slide);
  });

  readonly activeSlide = computed<UiHeroSlide | null>(() => {
    const list = this.slides();
    const idx = this.activeIndex();

    return list[Math.max(0, Math.min(idx, list.length - 1))] ?? null;
  });

  private tryStartAutoplay(): void {
    const prefersReducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

    if (prefersReducedMotion) return;
    if (this.slides().length <= 1) return;
    if (this.intervalId !== null) return;

    this.intervalId = window.setInterval(() => {
      if (this.userPaused()) return;
      this.next();
    }, 10_000);
  }

  private stopAutoplay(): void {
    if (this.intervalId === null) return;

    window.clearInterval(this.intervalId);
    this.intervalId = null;
  }

  private setActiveIndex(index: number): void {
    const len = this.slides().length;
    if (!len) return;

    this.activeIndex.set(Math.max(0, Math.min(index, len - 1)));
  }

  private shiftActiveIndex(delta: number): void {
    const len = this.slides().length;
    if (!len) return;

    this.activeIndex.set((this.activeIndex() + delta + len) % len);
  }

  prev(): void {
    this.userPaused.set(true);
    this.shiftActiveIndex(-1);
  }

  next(): void {
    this.shiftActiveIndex(1);
  }

  goTo(index: number): void {
    this.userPaused.set(true);
    this.setActiveIndex(index);
  }

  onCtaNavigate(path: string): void {
    void this.router.navigateByUrl(path);
  }

  onCtaKeydown(event: KeyboardEvent, path: string): void {
    if (event.key === 'Enter' || event.key === ' ' || event.code === 'Space') {
      event.preventDefault();
      this.onCtaNavigate(path);
    }
  }

  trackById = (_: number, item: UiHeroSlide): number => item.id;
  trackByCtaPath = (_: number, item: UiHeroSlide): string => item.ctaPath;

  dotAriaLabel(goToSlidePrefix: string, index: number): string {
    return `${goToSlidePrefix} ${index + 1}`;
  }
}
