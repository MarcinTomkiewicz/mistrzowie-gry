import { IHeroSlide } from '../../interfaces/home/i-hero-slide';

export type HeroSlideCopy = {
  id: number;
  heading: string;
  text: string;
  ctaLabel: string;
};

export type HeroCarouselAria = {
  sectionLabel: string;
  prev: string;
  next: string;
  dots: string;
  goToSlidePrefix: string;
};

export type HeroSlideTech = {
  id: number;
  ctaPath: string;
  imageSrc: string;
  imageAlt: string;
};

export type UiHeroSlide = IHeroSlide & { id: number };

export type ProblemCardCopy = {
  id: number;
  title: string;
  text: string;
};

export type ProblemCardCopyRecord = Record<string, ProblemCardCopy>;

export type ProblemsCtaKey =
  | 'joinProgram'
  | 'offerIndividual'
  | 'chaoticThursdays'
  | 'offerBusiness';

export type ProblemsHeader = {
  title: string;
  subtitle: string;
};

export type ProgramsCardCopy = {
  id: number;
  title: string;
  intro: string;
  bullets: string[];
};

export type ProgramsCardCopyRaw = {
  id: number;
  title: string;
  intro: string;
  bullets?: Record<string, string>;
};

export type ProgramsCardCopyRecord = Record<string, ProgramsCardCopyRaw>;

export type ProgramsCtaKey = 'checkDetails' | 'seeProgram';

export type ProgramsHeader = {
  title: string;
  subtitle: string;
};

export type SeoTextSectionCopy = {
  id: number;
  title: string;
  paragraphs: Record<string, string>;
};

export type SeoTextColumnCopy = {
  id: number;
  sections: Record<string, SeoTextSectionCopy>;
};

export type SeoTextColumnCopyRecord = Record<string, SeoTextColumnCopy>;

export type UiSeoTextSection = {
  id: number;
  title: string;
  paragraphs: string[];
};

export type UiSeoTextColumn = {
  id: number;
  sections: UiSeoTextSection[];
};

export type SeoTextHeader = {
  title: string;
  subtitle: string;
};
