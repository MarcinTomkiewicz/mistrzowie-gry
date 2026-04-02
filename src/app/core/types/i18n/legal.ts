import { RichContent } from '../rich-content';

export type ActiveLegalDialog = 'terms' | 'privacy-policy' | null;

export interface LegalDialogContent {
  title: string;
  subtitle?: string;
  content: RichContent;
}

export type LegalJsonPayload = {
  termsDialog?: LegalDialogContent;
  privacyPolicyDialog?: LegalDialogContent;
};

export type LegalDialogsPayload = Record<
  Exclude<ActiveLegalDialog, null>,
  LegalDialogContent | null
>;
