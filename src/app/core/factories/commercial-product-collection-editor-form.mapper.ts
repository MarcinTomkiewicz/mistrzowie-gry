import type {
  CommercialProductCollectionBlock,
  CommercialProductField,
} from '../types/commercial-page-builder';
import type {
  CommercialProductCollectionBlockEditorForm,
  CommercialProductFieldEditorForm,
} from '../types/commercial-builder-block-editor-form';
import { normalizeText } from '../utils/normalize-text';

export function mapCommercialProductCollectionBlockEditorForm(
  form: CommercialProductCollectionBlockEditorForm,
  position: number,
): CommercialProductCollectionBlock {
  const value = form.getRawValue();
  const type: CommercialProductCollectionBlock['type'] =
    'product_collection';
  const base = {
    id: value.id,
    position,
    type,
    productIds: value.productIds,
    fields: form.controls.fields.controls.map(mapProductField),
  };

  switch (value.presentation.type) {
    case 'cards':
      return {
        ...base,
        presentation: {
          type: value.presentation.type,
          orientation: value.presentation.orientation,
          columns: value.presentation.columns,
        },
      };
    case 'table':
      return { ...base, presentation: { type: value.presentation.type } };
    case 'comparison_table':
      return {
        ...base,
        presentation: {
          type: value.presentation.type,
          sections: form.controls.presentation.controls.sections.controls.map(
            (section, sectionIndex) => ({
              id: section.controls.id.getRawValue(),
              position: positionFor(sectionIndex),
              heading: normalizeText(section.controls.heading.getRawValue()),
              rows: section.controls.rows.controls.map((row, rowIndex) => ({
                id: row.controls.id.getRawValue(),
                position: positionFor(rowIndex),
                label: row.controls.label.getRawValue().trim(),
                fieldIds: row.controls.fieldIds.getRawValue(),
              })),
            }),
          ),
        },
      };
    default:
      return unsupportedCommercialProductCollectionPresentation(
        value.presentation.type,
      );
  }
}

function mapProductField(
  form: CommercialProductFieldEditorForm,
  index: number,
): CommercialProductField {
  const value = form.getRawValue();

  return {
    id: value.id,
    position: positionFor(index),
    key: value.key,
    label: normalizeText(value.label),
    productIds: value.productIds,
    labelOverrides: mapLabelOverrides(value.labelOverrides),
  };
}

function mapLabelOverrides(
  overrides: Array<{ productId: string; label: string }>,
): CommercialProductField['labelOverrides'] {
  const productIds = new Set<string>();

  for (const override of overrides) {
    if (productIds.has(override.productId)) {
      throw new TypeError('Each product can have at most one label override.');
    }

    productIds.add(override.productId);
  }

  return overrides.map((override) => ({
    productId: override.productId,
    label: override.label.trim(),
  }));
}

function positionFor(index: number): number {
  return (index + 1) * 10;
}

function unsupportedCommercialProductCollectionPresentation(
  presentation: never,
): never {
  throw new TypeError(
    `Unsupported commercial product collection presentation: ${String(presentation)}`,
  );
}
