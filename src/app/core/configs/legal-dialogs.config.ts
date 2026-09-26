import type { LegalDialogDefinition, LegalDialogId } from '../types/legal-dialog';

export const LEGAL_DIALOGS = {
  terms: { dialog: 'terms', labelKey: 'legal.terms' },
  'privacy-policy': {
    dialog: 'privacy-policy', labelKey: 'legal.privacyPolicy',
  },
  'minor-protection-standards': {
    dialog: 'minor-protection-standards', labelKey: 'legal.minorProtectionStandards',
  },
  'minor-protection-standards-for-minors': {
    dialog: 'minor-protection-standards-for-minors',
    labelKey: 'legal.minorProtectionStandardsForMinors',
  },
} satisfies Record<LegalDialogId, LegalDialogDefinition>;
