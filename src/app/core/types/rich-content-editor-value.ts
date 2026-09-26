export interface RichContentEditorValue {
  sections: RichContentEditorSection[];
}

export interface RichContentEditorSection {
  title?: string;
  blocks: RichContentEditorBlock[];
}

export type RichContentEditorBlock =
  | RichContentEditorParagraph
  | {
      type: 'ordered-list' | 'unordered-list';
      items: RichContentEditorListItem[];
    };

export interface RichContentEditorParagraph {
  type: 'paragraph';
  content: string;
}

export interface RichContentEditorListItem {
  content: string;
  blocks?: RichContentEditorBlock[];
}
