import type { LegalDialogId } from '../types/legal-dialog';

export interface ILegalLink {
  dialog: LegalDialogId;
  placement: 'bottom' | 'legal-information';
}

export interface IResolvedLegalLink extends ILegalLink {
  label: string;
}
