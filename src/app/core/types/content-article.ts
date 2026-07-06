export type ContentArticleStatus = 'draft' | 'published' | 'archived';

export type ContentArticleBlockKind = 'text_section' | 'image';

export type ContentArticlePublicationIssue =
  | 'title'
  | 'slug'
  | 'excerpt'
  | 'heroImagePath'
  | 'heroImageAlt'
  | 'textSectionBody'
  | 'imageAlt';
