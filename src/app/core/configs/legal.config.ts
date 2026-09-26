import type { ILegalLink } from '../interfaces/i-legal';

export const LEGAL_LINKS = [
  {
    dialog: 'privacy-policy',
    placement: 'bottom',
  },
  {
    dialog: 'terms',
    placement: 'bottom',
  },
  {
    dialog: 'minor-protection-standards',
    placement: 'legal-information',
  },
  {
    dialog: 'minor-protection-standards-for-minors',
    placement: 'legal-information',
  },
] satisfies ILegalLink[];
