import { CtaKey } from './programs.i18n';

export type ProgramsCardTech = {
  id: number;
  ctaPath: string;
  ctaKey: CtaKey;
};

const PROGRAMS_TECH: readonly ProgramsCardTech[] = [
  { id: 1, ctaPath: '/chaotic-thursdays', ctaKey: 'checkDetails' },
  { id: 2, ctaPath: '/join-the-party', ctaKey: 'seeProgram' },
] as const;

export const PROGRAMS_TECH_BY_ID = new Map<number, ProgramsCardTech>(
  PROGRAMS_TECH.map((item) => [item.id, item]),
);