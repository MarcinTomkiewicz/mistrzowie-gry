import type { InternalLinkMarkupNode } from './internal-link';
import type { NumericInterval } from './interval';
import type { LegalDialogId } from './legal-dialog';

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
  | RichContentStrongNode
  | RichContentDialogNode;

export interface RichContentStrongNode {
  type: 'strong';
  text: string;
}

export interface RichContentDialogNode {
  type: 'dialog';
  text: string;
  dialog: LegalDialogId;
}

export type RichContentInlineRange = NumericInterval & RichContentInlineNode;
export type RichContentInlineTargetType = 'link' | 'dialog';

export type RichContentInlineUpdate = {
  nodes: RichContentInlineNode[];
  selection: NumericInterval;
};
