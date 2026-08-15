import { ArticleEditorFormFieldRow } from '../types/article-editor-form';

export const ARTICLE_EDITOR_MAIN_FORM_FIELD_ROWS: readonly ArticleEditorFormFieldRow[] = [
  {
    columns: 2,
    fields: [
      {
        controlName: 'title',
        inputId: 'content-article-title',
        kind: 'text',
      },
      {
        controlName: 'slug',
        inputId: 'content-article-slug',
        kind: 'text',
        inputAction: 'slugManualEdit',
      },
    ],
  },
  {
    columns: 1,
    fields: [
      {
        controlName: 'excerpt',
        inputId: 'content-article-excerpt',
        kind: 'textarea',
        rows: 4,
      },
    ],
  },
  {
    columns: 1,
    fields: [
      {
        controlName: 'heroImageAlt',
        inputId: 'content-article-hero-image-alt',
        kind: 'text',
      },
    ],
  },
] as const;

export const ARTICLE_EDITOR_SEO_FORM_FIELD_ROWS: readonly ArticleEditorFormFieldRow[] = [
  {
    columns: 1,
    fields: [
      {
        controlName: 'seoTitle',
        inputId: 'content-article-seo-title',
        kind: 'text',
        inputAction: 'seoTitleManualEdit',
      },
    ],
  },
  {
    columns: 1,
    fields: [
      {
        controlName: 'seoDescription',
        inputId: 'content-article-seo-description',
        kind: 'textarea',
        rows: 4,
      },
    ],
  },
] as const;
