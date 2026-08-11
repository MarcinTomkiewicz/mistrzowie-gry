import type { FormArray, FormControl, FormGroup } from '@angular/forms';

import type {
  CommercialActionAppearance,
} from './commercial-page';
import type {
  CommercialButtonLayout,
  CommercialCardOrientation,
  CommercialIconKey,
  CommercialProductFieldKey,
  CommercialTextAlign,
} from './commercial-page-builder';
import type { CommercialPriceEditorForm } from './commercial-price-editor-form';
import type { CommercialRichContentEditorControl } from './commercial-rich-content-editor-form';

export type CommercialButtonEditorForm = FormGroup<{
  id: FormControl<string>;
  label: FormControl<string>;
  route: FormControl<string>;
  appearance: FormControl<CommercialActionAppearance>;
  iconKey: FormControl<CommercialIconKey | null>;
}>;

export type CommercialCardEditorForm = FormGroup<{
  id: FormControl<string>;
  title: FormControl<string>;
  body: CommercialRichContentEditorControl;
  hasPrice: FormControl<boolean>;
  price: CommercialPriceEditorForm;
}>;

export type CommercialProductLabelOverrideEditorForm = FormGroup<{
  productId: FormControl<string>;
  label: FormControl<string>;
}>;

export type CommercialProductFieldEditorForm = FormGroup<{
  id: FormControl<string>;
  key: FormControl<CommercialProductFieldKey>;
  label: FormControl<string>;
  productIds: FormControl<string[]>;
  labelOverrides: FormArray<CommercialProductLabelOverrideEditorForm>;
}>;

export type CommercialTableColumnEditorForm = FormGroup<{
  id: FormControl<string>;
  heading: CommercialRichContentEditorControl;
}>;

export type CommercialTableCellEditorForm = FormGroup<{
  columnId: FormControl<string>;
  content: CommercialRichContentEditorControl;
}>;

export type CommercialTableRowEditorForm = FormGroup<{
  id: FormControl<string>;
  cells: FormArray<CommercialTableCellEditorForm>;
}>;

export type CommercialFaqEntryEditorForm = FormGroup<{
  id: FormControl<string>;
  question: FormControl<string>;
  answer: CommercialRichContentEditorControl;
}>;

type CommercialBlockBaseEditorControls<TType extends string> = {
  id: FormControl<string>;
  type: FormControl<TType>;
};

export type CommercialRichTextBlockEditorForm = FormGroup<
  CommercialBlockBaseEditorControls<'rich_text'> & {
    content: CommercialRichContentEditorControl;
  }
>;

export type CommercialButtonsBlockEditorForm = FormGroup<
  CommercialBlockBaseEditorControls<'buttons'> & {
    layout: FormControl<CommercialButtonLayout>;
    align: FormControl<CommercialTextAlign>;
    buttons: FormArray<CommercialButtonEditorForm>;
  }
>;

export type CommercialCardsBlockEditorForm = FormGroup<
  CommercialBlockBaseEditorControls<'cards'> & {
    orientation: FormControl<CommercialCardOrientation>;
    columns: FormControl<1 | 2 | 3 | 4>;
    cards: FormArray<CommercialCardEditorForm>;
  }
>;

export type CommercialProductCollectionBlockEditorForm = FormGroup<
  CommercialBlockBaseEditorControls<'product_collection'> & {
    productIds: FormControl<string[]>;
    fields: FormArray<CommercialProductFieldEditorForm>;
    presentation: FormControl<'cards' | 'table' | 'comparison_table'>;
    cardOrientation: FormControl<CommercialCardOrientation>;
    columns: FormControl<1 | 2 | 3>;
  }
>;

export type CommercialTableBlockEditorForm = FormGroup<
  CommercialBlockBaseEditorControls<'table'> & {
    columns: FormArray<CommercialTableColumnEditorForm>;
    rows: FormArray<CommercialTableRowEditorForm>;
  }
>;

export type CommercialFaqBlockEditorForm = FormGroup<
  CommercialBlockBaseEditorControls<'faq'> & {
    items: FormArray<CommercialFaqEntryEditorForm>;
  }
>;

export type CommercialPageBlockEditorForm =
  | CommercialRichTextBlockEditorForm
  | CommercialButtonsBlockEditorForm
  | CommercialCardsBlockEditorForm
  | CommercialProductCollectionBlockEditorForm
  | CommercialTableBlockEditorForm
  | CommercialFaqBlockEditorForm;
