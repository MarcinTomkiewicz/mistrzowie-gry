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
  | RichContentTextNode
  | RichContentStrongNode
  | RichContentLinkNode;

export interface RichContentTextNode {
  type: 'text';
  text: string;
}

export interface RichContentStrongNode {
  type: 'strong';
  text: string;
}

export interface RichContentLinkNode {
  type: 'link';
  text: string;
  href: string;
  external?: boolean;
}