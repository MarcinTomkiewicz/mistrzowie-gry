import { HeroSlideTech } from './hero-carousel.i18n';

export const HERO_SLIDES_TECH: readonly HeroSlideTech[] = [
  {
    id: 1,
    ctaPath: '/offer/oferta-indywidualna',
    imageSrc: 'hero/hero-1.avif',
    imageAlt: 'Oferta indywidualna',
  },
  {
    id: 2,
    ctaPath: '/chaotic-thursdays',
    imageSrc: 'hero/hero-2.avif',
    imageAlt: 'Chaotyczne Czwartki',
  },
  {
    id: 3,
    ctaPath: '/join-the-party',
    imageSrc: 'hero/hero-3.avif',
    imageAlt: 'Dołącz do Drużyny',
  },
  {
    id: 4,
    ctaPath: '/offer/oferta-biznesowa',
    imageSrc: 'hero/hero-4.avif',
    imageAlt: 'Oferta biznesowa',
  },
] as const;

export const HERO_SLIDES_TECH_BY_ID = new Map<number, HeroSlideTech>(
  HERO_SLIDES_TECH.map((slide) => [slide.id, slide]),
);