import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { ContentArticleBlockKind } from './content-article';

export type ArticleEditorFormControlName =
  | 'title'
  | 'slug'
  | 'excerpt'
  | 'heroImagePath'
  | 'heroImageAlt'
  | 'seoTitle'
  | 'seoDescription';

export type ArticleEditorVisibleFormControlName = Exclude<
  ArticleEditorFormControlName,
  'heroImagePath'
>;

export type ArticleEditorFormFieldKind = 'text' | 'textarea';

export type ArticleEditorFormFieldInputAction =
  | 'slugManualEdit'
  | 'seoTitleManualEdit';

export type ArticleEditorTextFormField = {
  controlName: ArticleEditorVisibleFormControlName;
  inputId: string;
  kind: 'text';
  inputAction?: ArticleEditorFormFieldInputAction;
};

export type ArticleEditorTextareaFormField = {
  controlName: ArticleEditorVisibleFormControlName;
  inputId: string;
  kind: 'textarea';
  rows: number;
};

export type ArticleEditorFormField =
  | ArticleEditorTextFormField
  | ArticleEditorTextareaFormField;

export type ArticleEditorFormFieldRow = {
  columns: 1 | 2;
  fields: readonly ArticleEditorFormField[];
};

export type ArticleEditorBlockForm = FormGroup<{
  kind: FormControl<ContentArticleBlockKind>;
  heading: FormControl<string>;
  body: FormControl<string>;
  imagePath: FormControl<string>;
  imageAlt: FormControl<string>;
  caption: FormControl<string>;
}>;

export type ArticleEditorBlocksForm =
  FormArray<ArticleEditorBlockForm>;

export type ArticleEditorForm = FormGroup<{
  title: FormControl<string>;
  slug: FormControl<string>;
  excerpt: FormControl<string>;
  heroImagePath: FormControl<string>;
  heroImageAlt: FormControl<string>;
  seoTitle: FormControl<string>;
  seoDescription: FormControl<string>;
  blocks: ArticleEditorBlocksForm;
}>;
