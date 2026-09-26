import type { RichContent, RichContentInlineNode } from './rich-content';

export type DisplayFaqItem = { h: string; a: string };

export type FaqAccordionItem =
  | DisplayFaqItem
  | { h: RichContentInlineNode[]; a: RichContent };
