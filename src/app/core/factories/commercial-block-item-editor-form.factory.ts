import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';

import type {
  CommercialButton,
  CommercialCard,
  CommercialComparisonRow,
  CommercialComparisonSection,
  CommercialFaqEntry,
  CommercialProductField,
  CommercialTableColumn,
  CommercialTableRow,
} from '../types/commercial-page-builder';
import type {
  CommercialButtonEditorForm,
  CommercialCardEditorForm,
  CommercialComparisonRowEditorForm,
  CommercialComparisonSectionEditorForm,
  CommercialFaqEntryEditorForm,
  CommercialProductFieldEditorForm,
  CommercialProductLabelOverrideEditorForm,
  CommercialTableCellEditorForm,
  CommercialTableColumnEditorForm,
  CommercialTableRowEditorForm,
} from '../types/commercial-builder-block-editor-form';
import { compareByPosition } from '../utils/compare-by-position';
import { setControlEnabled } from '../utils/form-controls';
import { commercialProductFieldValidator } from '../validators/commercial-builder-editor.validator';
import { internalRouteValidator } from '../validators/internal-route.validator';
import { requiredTrimmedValidator } from '../validators/required-trimmed.validator';
import { createPriceEditorForm } from './price-editor-form.factory';
import { createRichContentEditorControl } from './rich-content-editor-form.factory';
import { createUuidFormControl } from './form-control.factory';

export function createCommercialButtonEditorForm(
  button: CommercialButton | null = null,
): CommercialButtonEditorForm {
  return new FormGroup({
    id: createUuidFormControl(button?.id),
    label: requiredTextControl(button?.label),
    route: new FormControl(button?.route ?? '', {
      nonNullable: true,
      validators: [
        requiredTrimmedValidator(),
        internalRouteValidator,
      ],
    }),
    appearance: new FormControl(button?.appearance ?? 'primary', {
      nonNullable: true,
    }),
    iconKey: new FormControl(button?.iconKey ?? null),
  });
}

export function createCommercialCardEditorForm(
  card: CommercialCard | null = null,
): CommercialCardEditorForm {
  const hasPrice = card?.price !== null && !!card;
  const price = createPriceEditorForm(card?.price ?? null);

  if (!hasPrice) price.disable({ emitEvent: false });

  return new FormGroup({
    id: createUuidFormControl(card?.id),
    title: requiredTextControl(card?.title),
    body: createRichContentEditorControl(card?.body ?? null, false),
    hasPrice: new FormControl(hasPrice, { nonNullable: true }),
    price,
  });
}

export function syncCommercialCardPriceControl(
  form: CommercialCardEditorForm,
): void {
  setControlEnabled(form.controls.price, form.controls.hasPrice.getRawValue());
}

export function createCommercialProductFieldEditorForm(
  field: CommercialProductField | null = null,
): CommercialProductFieldEditorForm {
  return new FormGroup(
    {
      id: createUuidFormControl(field?.id),
      key: new FormControl(field?.key ?? 'name', { nonNullable: true }),
      label: new FormControl(field?.label ?? null),
      productIds: new FormControl(field?.productIds ?? null),
      labelOverrides: new FormArray(
        (field?.labelOverrides ?? []).map(
          ({ productId, label }) =>
            createCommercialProductLabelOverrideEditorForm(productId, label),
        ),
      ),
    },
    { validators: [commercialProductFieldValidator] },
  );
}

export function createCommercialProductLabelOverrideEditorForm(
  productId = '',
  label = '',
): CommercialProductLabelOverrideEditorForm {
  return new FormGroup({
    productId: new FormControl(productId, {
      nonNullable: true,
      validators: [requiredTrimmedValidator()],
    }),
    label: requiredTextControl(label),
  });
}

export function createCommercialComparisonSectionEditorForm(
  section: CommercialComparisonSection | null = null,
): CommercialComparisonSectionEditorForm {
  return new FormGroup({
    id: createUuidFormControl(section?.id),
    heading: new FormControl(section?.heading ?? '', { nonNullable: true }),
    rows: new FormArray(
      section
        ? [...section.rows]
            .sort(compareByPosition)
            .map(createCommercialComparisonRowEditorForm)
        : [],
    ),
  });
}

export function createCommercialComparisonRowEditorForm(
  row: CommercialComparisonRow | null = null,
): CommercialComparisonRowEditorForm {
  return new FormGroup({
    id: createUuidFormControl(row?.id),
    label: requiredTextControl(row?.label),
    fieldIds: new FormControl(row?.fieldIds ?? [], {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
}

export function createCommercialTableColumnEditorForm(
  column: CommercialTableColumn | null = null,
): CommercialTableColumnEditorForm {
  return new FormGroup({
    id: createUuidFormControl(column?.id),
    label: requiredTextControl(column?.label),
  });
}

export function createCommercialTableCellEditorForm(
  columnId: string,
  row: CommercialTableRow | null = null,
): CommercialTableCellEditorForm {
  const cell = row?.cells.find((candidate) => candidate.columnId === columnId);

  return new FormGroup({
    columnId: new FormControl(columnId, { nonNullable: true }),
    content: createRichContentEditorControl(
      cell?.content ?? null,
      true,
    ),
  });
}

export function createCommercialTableRowEditorForm(
  columnIds: string[],
  row: CommercialTableRow | null = null,
): CommercialTableRowEditorForm {
  return new FormGroup({
    id: createUuidFormControl(row?.id),
    cells: new FormArray(
      columnIds.map((columnId) =>
        createCommercialTableCellEditorForm(columnId, row),
      ),
      { validators: [Validators.required] },
    ),
  });
}

export function createCommercialFaqEntryEditorForm(
  item: CommercialFaqEntry | null = null,
): CommercialFaqEntryEditorForm {
  return new FormGroup({
    id: createUuidFormControl(item?.id),
    question: requiredTextControl(item?.question),
    answer: requiredTextControl(item?.answer),
  });
}

function requiredTextControl(value?: string) {
  return new FormControl(value ?? '', {
    nonNullable: true,
    validators: [requiredTrimmedValidator()],
  });
}
