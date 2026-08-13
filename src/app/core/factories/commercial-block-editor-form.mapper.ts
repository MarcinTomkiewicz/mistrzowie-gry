import type {
  CommercialButtonsBlock,
  CommercialCardsBlock,
  CommercialFaqBlock,
  CommercialPageBlock,
  CommercialRichTextBlock,
  CommercialTableBlock,
} from '../types/commercial-page-builder';
import type {
  CommercialButtonsBlockEditorForm,
  CommercialCardsBlockEditorForm,
  CommercialFaqBlockEditorForm,
  CommercialPageBlockEditorForm,
  CommercialProductCollectionBlockEditorForm,
  CommercialRichTextBlockEditorForm,
  CommercialTableBlockEditorForm,
} from '../types/commercial-builder-block-editor-form';
import {
  mapPriceEditorForm,
} from './price-editor-form.factory';
import { mapRichContentEditorControl } from './rich-content-editor-form.factory';
import { mapCommercialProductCollectionBlockEditorForm } from './commercial-product-collection-editor-form.mapper';

export function mapCommercialPageBlockEditorForm(
  form: CommercialPageBlockEditorForm,
  position: number,
): CommercialPageBlock {
  const blockType: unknown = form.controls.type.getRawValue();

  if (isCommercialRichTextBlockEditorForm(form)) {
    return mapRichTextBlock(form, position);
  }

  if (isCommercialButtonsBlockEditorForm(form)) {
    return mapButtonsBlock(form, position);
  }

  if (isCommercialCardsBlockEditorForm(form)) {
    return mapCardsBlock(form, position);
  }

  if (isCommercialProductCollectionBlockEditorForm(form)) {
    return mapCommercialProductCollectionBlockEditorForm(form, position);
  }

  if (isCommercialTableBlockEditorForm(form)) {
    return mapTableBlock(form, position);
  }

  if (isCommercialFaqBlockEditorForm(form)) {
    return mapFaqBlock(form, position);
  }

  throw new TypeError(
    `Unsupported commercial block editor type: ${String(blockType)}`,
  );
}

export function isCommercialRichTextBlockEditorForm(
  form: CommercialPageBlockEditorForm,
): form is CommercialRichTextBlockEditorForm {
  return form.controls.type.value === 'rich_text';
}

export function isCommercialButtonsBlockEditorForm(
  form: CommercialPageBlockEditorForm,
): form is CommercialButtonsBlockEditorForm {
  return form.controls.type.value === 'buttons';
}

export function isCommercialCardsBlockEditorForm(
  form: CommercialPageBlockEditorForm,
): form is CommercialCardsBlockEditorForm {
  return form.controls.type.value === 'cards';
}

export function isCommercialProductCollectionBlockEditorForm(
  form: CommercialPageBlockEditorForm,
): form is CommercialProductCollectionBlockEditorForm {
  return form.controls.type.value === 'product_collection';
}

export function isCommercialTableBlockEditorForm(
  form: CommercialPageBlockEditorForm,
): form is CommercialTableBlockEditorForm {
  return form.controls.type.value === 'table';
}

export function isCommercialFaqBlockEditorForm(
  form: CommercialPageBlockEditorForm,
): form is CommercialFaqBlockEditorForm {
  return form.controls.type.value === 'faq';
}

function mapRichTextBlock(
  form: CommercialRichTextBlockEditorForm,
  position: number,
): CommercialRichTextBlock {
  return {
    ...blockBase(form, position),
    type: 'rich_text',
    content: mapRichContentEditorControl(
      form.controls.content,
      true,
    ),
  };
}

function mapButtonsBlock(
  form: CommercialButtonsBlockEditorForm,
  position: number,
): CommercialButtonsBlock {
  const value = form.getRawValue();

  return {
    ...blockBase(form, position),
    type: 'buttons',
    presentation: {
      layout: value.presentation.layout,
      align: value.presentation.align,
    },
    buttons: form.controls.buttons.controls.map((button, index) => {
      const buttonValue = button.getRawValue();

      return {
        id: buttonValue.id,
        position: positionFor(index),
        label: buttonValue.label.trim(),
        route: buttonValue.route.trim(),
        appearance: buttonValue.appearance,
        iconKey: buttonValue.iconKey,
      };
    }),
  };
}

function mapCardsBlock(
  form: CommercialCardsBlockEditorForm,
  position: number,
): CommercialCardsBlock {
  const value = form.getRawValue();

  return {
    ...blockBase(form, position),
    type: 'cards',
    presentation: {
      orientation: value.presentation.orientation,
      columns: value.presentation.columns,
    },
    items: form.controls.items.controls.map((card, index) => {
      const cardValue = card.getRawValue();

      return {
        id: cardValue.id,
        position: positionFor(index),
        title: cardValue.title.trim(),
        body: mapRichContentEditorControl(
          card.controls.body,
          false,
        ),
        price: cardValue.hasPrice
          ? mapPriceEditorForm(card.controls.price)
          : null,
      };
    }),
  };
}

function mapTableBlock(
  form: CommercialTableBlockEditorForm,
  position: number,
): CommercialTableBlock {
  return {
    ...blockBase(form, position),
    type: 'table',
    columns: form.controls.columns.controls.map((column, index) => ({
      id: column.controls.id.getRawValue(),
      position: positionFor(index),
      label: column.controls.label.getRawValue().trim(),
    })),
    rows: form.controls.rows.controls.map((row, index) => ({
      id: row.controls.id.getRawValue(),
      position: positionFor(index),
      cells: row.controls.cells.controls.map((cell) => ({
        columnId: cell.controls.columnId.getRawValue(),
        content: mapRichContentEditorControl(
          cell.controls.content,
          true,
        ),
      })),
    })),
  };
}

function mapFaqBlock(
  form: CommercialFaqBlockEditorForm,
  position: number,
): CommercialFaqBlock {
  return {
    ...blockBase(form, position),
    type: 'faq',
    items: form.controls.items.controls.map((item, index) => ({
      id: item.controls.id.getRawValue(),
      position: positionFor(index),
      question: item.controls.question.getRawValue().trim(),
      answer: item.controls.answer.getRawValue().trim(),
    })),
  };
}

function blockBase(
  form: CommercialPageBlockEditorForm,
  position: number,
) {
  return { id: form.controls.id.getRawValue(), position };
}

function positionFor(index: number): number {
  return (index + 1) * 10;
}
