export type LegalDialogId =
  | 'terms'
  | 'privacy-policy'
  | 'minor-protection-standards'
  | 'minor-protection-standards-for-minors';

export interface LegalDialogDefinition {
  dialog: LegalDialogId;
  labelKey: string;
}
