import type { RichContent } from '../rich-content';

export interface LegalDialogContent {
  title?: string;
  subtitle?: string;
  content: RichContent;
}
