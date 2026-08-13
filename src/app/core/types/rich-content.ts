export type RichContentInput = string | RichContent | null | undefined;

export interface RichContent {
  sections: RichContentSection[];
}

export interface RichContentSection {
  title?: string;
  blocks: RichContentBlock[];
}

export type RichContentBlock =
  | RichContentParagraphBlock
  | RichContentOrderedListBlock
  | RichContentUnorderedListBlock;

export interface RichContentParagraphBlock {
  type: 'paragraph';
  text?: string;
  content?: RichContentInlineNode[];
}

export interface RichContentOrderedListBlock {
  type: 'ordered-list';
  items: RichContentListItem[];
}

export interface RichContentUnorderedListBlock {
  type: 'unordered-list';
  items: RichContentListItem[];
}

export interface RichContentListItem {
  text?: string;
  content?: RichContentInlineNode[];
  blocks?: RichContentBlock[];
}

export type RichContentInlineNode =
  | InternalLinkMarkupNode
  | RichContentStrongNode;

export interface RichContentStrongNode {
  type: 'strong';
  text: string;
}

import type { InternalLinkMarkupNode } from './internal-link';
