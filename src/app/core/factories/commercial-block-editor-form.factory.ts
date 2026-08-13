import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';

import type {
  CommercialBlockType,
  CommercialButtonLayout,
  CommercialCardOrientation,
  CommercialPageBlock,
  CommercialProductCollectionBlock,
  CommercialTableBlock,
  CommercialTextAlign,
} from '../types/commercial-page-builder';
import type {
  CommercialPageBlockEditorForm,
  CommercialProductCollectionBlockEditorForm,
} from '../types/commercial-builder-block-editor-form';
import { compareByPosition } from '../utils/compare-by-position';
import { setControlEnabled } from '../utils/form-controls';
import { commercialProductCollectionValidator } from '../validators/commercial-builder-editor.validator';
import {
  createCommercialButtonEditorForm,
  createCommercialCardEditorForm,
  createCommercialComparisonSectionEditorForm,
  createCommercialFaqEntryEditorForm,
  createCommercialProductFieldEditorForm,
  createCommercialTableColumnEditorForm,
  createCommercialTableRowEditorForm,
} from './commercial-block-item-editor-form.factory';
import { createRichContentEditorControl } from './rich-content-editor-form.factory';
import { createUuidFormControl } from './form-control.factory';

export function createCommercialBlockEditorForm(
  block: CommercialPageBlock,
): CommercialPageBlockEditorForm {
  const id = createUuidFormControl(block.id);

  switch (block.type) {
    case 'rich_text':
      return new FormGroup({
        id,
        type: literalControl('rich_text'),
        content: createRichContentEditorControl(block.content, true),
      });
    case 'buttons':
      return new FormGroup({
        id,
        type: literalControl('buttons'),
        presentation: new FormGroup({
          layout: literalControl(block.presentation.layout),
          align: literalControl(block.presentation.align),
        }),
        buttons: requiredArray(
          [...block.buttons].sort(compareByPosition),
          createCommercialButtonEditorForm,
        ),
      });
    case 'cards':
      return new FormGroup({
        id,
        type: literalControl('cards'),
        presentation: new FormGroup({
          orientation: literalControl(block.presentation.orientation),
          columns: literalControl(block.presentation.columns),
        }),
        items: requiredArray(
          [...block.items].sort(compareByPosition),
          createCommercialCardEditorForm,
        ),
      });
    case 'product_collection':
      return createProductCollectionEditorForm(
        block,
        id,
        literalControl('product_collection'),
      );
    case 'table':
      return createTableEditorForm(block, id, literalControl('table'));
    case 'faq':
      return new FormGroup({
        id,
        type: literalControl('faq'),
        items: requiredArray(
          [...block.items].sort(compareByPosition),
          createCommercialFaqEntryEditorForm,
        ),
      });
    default:
      return unsupportedCommercialBlock(block);
  }
}

export function createNewCommercialBlockEditorForm(
  type: CommercialBlockType,
): CommercialPageBlockEditorForm {
  const id = createUuidFormControl();

  switch (type) {
    case 'rich_text':
      return new FormGroup({
        id,
        type: literalControl('rich_text'),
        content: createRichContentEditorControl(null, true),
      });
    case 'buttons':
      return new FormGroup({
        id,
        type: literalControl('buttons'),
        presentation: new FormGroup({
          layout: literalControl<CommercialButtonLayout>('horizontal'),
          align: literalControl<CommercialTextAlign>('left'),
        }),
        buttons: requiredArray([null], createCommercialButtonEditorForm),
      });
    case 'cards':
      return new FormGroup({
        id,
        type: literalControl('cards'),
        presentation: new FormGroup({
          orientation: literalControl<CommercialCardOrientation>('vertical'),
          columns: literalControl<1 | 2 | 3>(3),
        }),
        items: requiredArray([null], createCommercialCardEditorForm),
      });
    case 'product_collection':
      return createProductCollectionEditorForm(
        null,
        id,
        literalControl('product_collection'),
      );
    case 'table':
      return createTableEditorForm(null, id, literalControl('table'));
    case 'faq':
      return new FormGroup({
        id,
        type: literalControl('faq'),
        items: requiredArray([null], createCommercialFaqEntryEditorForm),
      });
    default:
      return unsupportedCommercialBlockType(type);
  }
}

export function syncCommercialProductCollectionPresentationControls(
  form: CommercialProductCollectionBlockEditorForm,
): void {
  const presentation = form.controls.presentation;
  const cards = presentation.controls.type.getRawValue() === 'cards';
  const comparison =
    presentation.controls.type.getRawValue() === 'comparison_table';
  setControlEnabled(presentation.controls.orientation, cards);
  setControlEnabled(presentation.controls.columns, cards);
  setControlEnabled(presentation.controls.sections, comparison);
}

function createProductCollectionEditorForm(
  block: CommercialProductCollectionBlock | null,
  id: FormControl<string>,
  type: FormControl<'product_collection'>,
): CommercialProductCollectionBlockEditorForm {
  const form = new FormGroup(
    {
      id,
      type,
      productIds: new FormControl(block?.productIds ?? [], {
        nonNullable: true,
        validators: [Validators.required],
      }),
      fields: requiredArray(
        block ? [...block.fields].sort(compareByPosition) : [null],
        createCommercialProductFieldEditorForm,
      ),
      presentation: new FormGroup({
        type: literalControl(block?.presentation.type ?? 'cards'),
        orientation: literalControl(
          block?.presentation.type === 'cards'
            ? block.presentation.orientation
            : 'vertical',
        ),
        columns: literalControl(
          block?.presentation.type === 'cards'
            ? block.presentation.columns
            : 3,
        ),
        sections: new FormArray(
          block?.presentation.type === 'comparison_table'
            ? [...block.presentation.sections]
                .sort(compareByPosition)
                .map(createCommercialComparisonSectionEditorForm)
            : [],
        ),
      }),
    },
    { validators: [commercialProductCollectionValidator] },
  );

  syncCommercialProductCollectionPresentationControls(form);
  return form;
}

function createTableEditorForm(
  block: CommercialTableBlock | null,
  id: FormControl<string>,
  type: FormControl<'table'>,
) {
  const columns = block
    ? [...block.columns]
        .sort(compareByPosition)
        .map(createCommercialTableColumnEditorForm)
    : [createCommercialTableColumnEditorForm()];
  const columnIds = columns.map((column) => column.controls.id.getRawValue());

  return new FormGroup({
    id,
    type,
    columns: new FormArray(columns, { validators: [Validators.required] }),
    rows: requiredArray(
      block ? [...block.rows].sort(compareByPosition) : [null],
      (row) => createCommercialTableRowEditorForm(columnIds, row),
    ),
  });
}

function requiredArray<TValue, TControl extends FormGroup>(
  values: TValue[],
  createControl: (value: TValue) => TControl,
) {
  return new FormArray(values.map(createControl), {
    validators: [Validators.required],
  });
}

function literalControl<TValue extends string | number>(value: TValue) {
  return new FormControl(value, { nonNullable: true });
}

function unsupportedCommercialBlock(block: never): never {
  throw new TypeError(`Unsupported commercial block: ${JSON.stringify(block)}`);
}

function unsupportedCommercialBlockType(type: never): never {
  throw new TypeError(`Unsupported commercial block type: ${String(type)}`);
}
