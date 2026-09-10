import type { ILegalLink } from '../interfaces/i-legal';

export const LEGAL_LINKS = [
  {
    labelKey: 'legal.privacyPolicy',
    dialog: 'privacy-policy',
    placement: 'bottom',
  },
  {
    labelKey: 'legal.terms',
    dialog: 'terms',
    placement: 'bottom',
  },
  {
    labelKey: 'legal.minorProtectionStandards',
    dialog: 'minor-protection-standards',
    placement: 'legal-information',
  },
  {
    labelKey: 'legal.minorProtectionStandardsForMinors',
    dialog: 'minor-protection-standards-for-minors',
    placement: 'legal-information',
  },
] satisfies ILegalLink[];
