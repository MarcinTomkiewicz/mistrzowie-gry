import { ArticleEditorFormFieldRow } from '../types/article-editor-form';

export const ARTICLE_EDITOR_MAIN_FORM_FIELD_ROWS: readonly ArticleEditorFormFieldRow[] = [
  {
    columns: 2,
    fields: [
      {
        controlName: 'title',
        inputId: 'content-article-title',
        kind: 'text',
        labelKey: 'title',
      },
      {
        controlName: 'slug',
        inputId: 'content-article-slug',
        kind: 'text',
        labelKey: 'slug',
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
        labelKey: 'excerpt',
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
        labelKey: 'heroImageAlt',
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
        labelKey: 'seoTitle',
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
        labelKey: 'seoDescription',
        rows: 4,
      },
    ],
  },
] as const;
