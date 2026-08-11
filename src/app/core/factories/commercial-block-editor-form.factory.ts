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
import { setControlEnabled } from '../utils/form-controls';
import { commercialProductCollectionValidator } from '../validators/commercial-builder-editor.validator';
import {
  createCommercialButtonEditorForm,
  createCommercialCardEditorForm,
  createCommercialFaqEntryEditorForm,
  createCommercialProductFieldEditorForm,
  createCommercialTableColumnEditorForm,
  createCommercialTableRowEditorForm,
} from './commercial-block-item-editor-form.factory';
import { createCommercialRichContentEditorControl } from './commercial-rich-content-editor-form.factory';

export function createCommercialBlockEditorForm(
  block: CommercialPageBlock,
): CommercialPageBlockEditorForm {
  const id = idControl(block.id);

  switch (block.type) {
    case 'rich_text':
      return new FormGroup({
        id,
        type: literalControl('rich_text'),
        content: createCommercialRichContentEditorControl(block.content, true),
      });
    case 'buttons':
      return new FormGroup({
        id,
        type: literalControl('buttons'),
        layout: literalControl(block.layout),
        align: literalControl(block.align),
        buttons: requiredArray(
          [...block.buttons].sort(byPosition),
          createCommercialButtonEditorForm,
        ),
      });
    case 'cards':
      return new FormGroup({
        id,
        type: literalControl('cards'),
        orientation: literalControl(block.orientation),
        columns: literalControl(block.columns),
        cards: requiredArray(
          [...block.cards].sort(byPosition),
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
          [...block.items].sort(byPosition),
          createCommercialFaqEntryEditorForm,
        ),
      });
  }
}

export function createNewCommercialBlockEditorForm(
  type: CommercialBlockType,
): CommercialPageBlockEditorForm {
  const id = idControl();

  switch (type) {
    case 'rich_text':
      return new FormGroup({
        id,
        type: literalControl('rich_text'),
        content: createCommercialRichContentEditorControl(null, true),
      });
    case 'buttons':
      return new FormGroup({
        id,
        type: literalControl('buttons'),
        layout: literalControl<CommercialButtonLayout>('horizontal'),
        align: literalControl<CommercialTextAlign>('left'),
        buttons: requiredArray([null], createCommercialButtonEditorForm),
      });
    case 'cards':
      return new FormGroup({
        id,
        type: literalControl('cards'),
        orientation: literalControl<CommercialCardOrientation>('vertical'),
        columns: literalControl<1 | 2 | 3 | 4>(3),
        cards: requiredArray([null], createCommercialCardEditorForm),
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
  }
}

export function syncCommercialProductCollectionPresentationControls(
  form: CommercialProductCollectionBlockEditorForm,
): void {
  const cards = form.controls.presentation.getRawValue() === 'cards';
  setControlEnabled(form.controls.cardOrientation, cards);
  setControlEnabled(form.controls.columns, cards);
}

function createProductCollectionEditorForm(
  block: CommercialProductCollectionBlock | null,
  id: ReturnType<typeof idControl>,
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
        block ? [...block.fields].sort(byPosition) : [null],
        createCommercialProductFieldEditorForm,
      ),
      presentation: literalControl(block?.presentation ?? 'cards'),
      cardOrientation: literalControl(
        block?.presentation === 'cards' ? block.cardOrientation : 'vertical',
      ),
      columns: literalControl(
        block?.presentation === 'cards' ? block.columns : 3,
      ),
    },
    { validators: [commercialProductCollectionValidator] },
  );

  syncCommercialProductCollectionPresentationControls(form);
  return form;
}

function createTableEditorForm(
  block: CommercialTableBlock | null,
  id: ReturnType<typeof idControl>,
  type: FormControl<'table'>,
) {
  const columns = block
    ? [...block.columns].sort(byPosition).map(createCommercialTableColumnEditorForm)
    : [createCommercialTableColumnEditorForm()];
  const columnIds = columns.map((column) => column.controls.id.getRawValue());

  return new FormGroup({
    id,
    type,
    columns: new FormArray(columns, { validators: [Validators.required] }),
    rows: requiredArray(
      block ? [...block.rows].sort(byPosition) : [null],
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

function idControl(id: string = crypto.randomUUID()): FormControl<string> {
  return new FormControl(id, { nonNullable: true });
}

function byPosition(
  left: { position: number },
  right: { position: number },
): number {
  return left.position - right.position;
}
