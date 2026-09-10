import type { LegalDialogId } from '../types/i18n/legal';

export interface ILegalLink {
  labelKey: string;
  dialog: LegalDialogId;
  placement: 'bottom' | 'legal-information';
}

export interface IResolvedLegalLink extends Omit<ILegalLink, 'labelKey'> {
  label: string;
}
