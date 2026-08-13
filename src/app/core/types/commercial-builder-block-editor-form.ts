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
import type { PriceEditorForm } from './price-editor-form';
import type { RichContentEditorControl } from './rich-content-editor';

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
  body: RichContentEditorControl;
  hasPrice: FormControl<boolean>;
  price: PriceEditorForm;
}>;

export type CommercialProductLabelOverrideEditorForm = FormGroup<{
  productId: FormControl<string>;
  label: FormControl<string>;
}>;

export type CommercialProductFieldEditorForm = FormGroup<{
  id: FormControl<string>;
  key: FormControl<CommercialProductFieldKey>;
  label: FormControl<string | null>;
  productIds: FormControl<string[] | null>;
  labelOverrides: FormArray<CommercialProductLabelOverrideEditorForm>;
}>;

export type CommercialComparisonRowEditorForm = FormGroup<{
  id: FormControl<string>;
  label: FormControl<string>;
  fieldIds: FormControl<string[]>;
}>;

export type CommercialComparisonSectionEditorForm = FormGroup<{
  id: FormControl<string>;
  heading: FormControl<string>;
  rows: FormArray<CommercialComparisonRowEditorForm>;
}>;

export type CommercialTableColumnEditorForm = FormGroup<{
  id: FormControl<string>;
  label: FormControl<string>;
}>;

export type CommercialTableCellEditorForm = FormGroup<{
  columnId: FormControl<string>;
  content: RichContentEditorControl;
}>;

export type CommercialTableRowEditorForm = FormGroup<{
  id: FormControl<string>;
  cells: FormArray<CommercialTableCellEditorForm>;
}>;

export type CommercialFaqEntryEditorForm = FormGroup<{
  id: FormControl<string>;
  question: FormControl<string>;
  answer: FormControl<string>;
}>;

type CommercialBlockBaseEditorControls<TType extends string> = {
  id: FormControl<string>;
  type: FormControl<TType>;
};

export type CommercialRichTextBlockEditorForm = FormGroup<
  CommercialBlockBaseEditorControls<'rich_text'> & {
    content: RichContentEditorControl;
  }
>;

export type CommercialButtonsBlockEditorForm = FormGroup<
  CommercialBlockBaseEditorControls<'buttons'> & {
    presentation: FormGroup<{
      layout: FormControl<CommercialButtonLayout>;
      align: FormControl<CommercialTextAlign>;
    }>;
    buttons: FormArray<CommercialButtonEditorForm>;
  }
>;

export type CommercialCardsBlockEditorForm = FormGroup<
  CommercialBlockBaseEditorControls<'cards'> & {
    presentation: FormGroup<{
      orientation: FormControl<CommercialCardOrientation>;
      columns: FormControl<1 | 2 | 3>;
    }>;
    items: FormArray<CommercialCardEditorForm>;
  }
>;

export type CommercialProductCollectionBlockEditorForm = FormGroup<
  CommercialBlockBaseEditorControls<'product_collection'> & {
    productIds: FormControl<string[]>;
    fields: FormArray<CommercialProductFieldEditorForm>;
    presentation: FormGroup<{
      type: FormControl<'cards' | 'table' | 'comparison_table'>;
      orientation: FormControl<CommercialCardOrientation>;
      columns: FormControl<1 | 2 | 3>;
      sections: FormArray<CommercialComparisonSectionEditorForm>;
    }>;
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
