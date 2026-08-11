import type { RichContent } from './rich-content';

export type DisplayFaqItem = { h: string; a: string };

export type FaqAccordionItem =
  | DisplayFaqItem
  | { h: string; a: RichContent };
