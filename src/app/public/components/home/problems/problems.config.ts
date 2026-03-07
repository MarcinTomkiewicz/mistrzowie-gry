import { CtaKey } from './problems.i18n';

export type ProblemCardTech = {
  id: number;
  ctaPath: string;
  icon: string;
  ctaKey: CtaKey;
};

const PROBLEMS_TECH: readonly ProblemCardTech[] = [
  {
    id: 1,
    ctaPath: '/join-the-party',
    icon: 'pi pi-uprising',
    ctaKey: 'joinProgram',
  },
  {
    id: 2,
    ctaPath: '/offer/oferta-indywidualna',
    icon: 'pi pi-read',
    ctaKey: 'offerIndividual',
  },
  {
    id: 3,
    ctaPath: '/chaotic-thursdays',
    icon: 'pi pi-evil-book',
    ctaKey: 'chaoticThursdays',
  },
  {
    id: 4,
    ctaPath: '/offer/oferta-biznesowa',
    icon: 'pi pi-teacher',
    ctaKey: 'offerBusiness',
  },
] as const;

export const PROBLEMS_TECH_BY_ID = new Map<number, ProblemCardTech>(
  PROBLEMS_TECH.map((item) => [item.id, item]),
);