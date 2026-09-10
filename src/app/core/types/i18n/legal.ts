import { RichContent } from '../rich-content';

export type LegalDialogId =
  | 'terms'
  | 'privacy-policy'
  | 'minor-protection-standards'
  | 'minor-protection-standards-for-minors';

export interface LegalDialogContent {
  title?: string;
  subtitle?: string;
  content: RichContent;
}
