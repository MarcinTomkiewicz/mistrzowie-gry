import { FormArray, FormControl, FormGroup } from '@angular/forms';

export type ContentArticleEditorFormControlName =
  | 'title'
  | 'slug'
  | 'excerpt'
  | 'heroImagePath'
  | 'heroImageAlt'
  | 'seoTitle'
  | 'seoDescription';

export type ContentArticleEditorFormFieldKind = 'text' | 'textarea';

export type ContentArticleEditorFormFieldLabelKey =
  ContentArticleEditorFormControlName;

export type ContentArticleEditorFormFieldInputAction =
  | 'slugManualEdit'
  | 'seoTitleManualEdit';

export type ContentArticleEditorTextFormField = {
  controlName: ContentArticleEditorFormControlName;
  inputId: string;
  kind: 'text';
  labelKey: ContentArticleEditorFormFieldLabelKey;
  inputAction?: ContentArticleEditorFormFieldInputAction;
};

export type ContentArticleEditorTextareaFormField = {
  controlName: ContentArticleEditorFormControlName;
  inputId: string;
  kind: 'textarea';
  labelKey: ContentArticleEditorFormFieldLabelKey;
  rows: number;
};

export type ContentArticleEditorFormField =
  | ContentArticleEditorTextFormField
  | ContentArticleEditorTextareaFormField;

export type ContentArticleEditorFormFieldRow = {
  columns: 1 | 2;
  fields: readonly ContentArticleEditorFormField[];
};

export type ContentArticleEditorTextBlockForm = FormGroup<{
  heading: FormControl<string>;
  body: FormControl<string>;
}>;

export type ContentArticleEditorTextBlocksForm =
  FormArray<ContentArticleEditorTextBlockForm>;

export type ContentArticleEditorForm = FormGroup<{
  title: FormControl<string>;
  slug: FormControl<string>;
  excerpt: FormControl<string>;
  heroImagePath: FormControl<string>;
  heroImageAlt: FormControl<string>;
  seoTitle: FormControl<string>;
  seoDescription: FormControl<string>;
  blocks: ContentArticleEditorTextBlocksForm;
}>;
