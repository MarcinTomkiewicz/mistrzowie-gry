import type { FormArray } from '@angular/forms';

import { isCommercialProductCollectionBlockEditorForm } from '../factories/commercial-block-editor-form.mapper';
import type {
  CommercialProductCollectionBlockEditorForm,
  CommercialProductFieldEditorForm,
} from '../types/commercial-builder-block-editor-form';
import type {
  CommercialProductEditorForm,
  CommercialSectionEditorForm,
} from '../types/commercial-page-editor-form';

export function removeCommercialProductReferences(
  products: FormArray<CommercialProductEditorForm>,
  sections: FormArray<CommercialSectionEditorForm>,
  productId: string,
): void {
  for (const product of products.controls) {
    const includedAddonIds = product.controls.includedAddonIds.getRawValue();
    if (!includedAddonIds.includes(productId)) continue;

    product.controls.includedAddonIds.setValue(
      includedAddonIds.filter((candidate) => candidate !== productId),
    );
    product.controls.includedAddonIds.markAsDirty();
  }

  for (const section of sections.controls) {
    for (const block of section.controls.blocks.controls) {
      if (!isCommercialProductCollectionBlockEditorForm(block)) continue;

      const productIds = block.controls.productIds.getRawValue();
      if (productIds.includes(productId)) {
        block.controls.productIds.setValue(
          productIds.filter((candidate) => candidate !== productId),
        );
        block.controls.productIds.markAsDirty();
      }

      syncCommercialProductCollectionReferences(block);
    }
  }
}

export function syncCommercialProductCollectionReferences(
  form: CommercialProductCollectionBlockEditorForm,
): void {
  const collectionProductIds = new Set(
    form.controls.productIds.getRawValue(),
  );

  for (const field of form.controls.fields.controls) {
    const productIds = field.controls.productIds.getRawValue();
    const nextProductIds = productIds?.filter((productId) =>
      collectionProductIds.has(productId)
    ) ?? null;

    if (productIds && nextProductIds?.length !== productIds.length) {
      field.controls.productIds.setValue(nextProductIds);
      field.controls.productIds.markAsDirty();
    }

    syncCommercialProductFieldReferences(
      field,
      form.controls.productIds.getRawValue(),
    );
  }

  syncCommercialComparisonFieldReferences(form);
}

export function syncCommercialProductFieldReferences(
  field: CommercialProductFieldEditorForm,
  collectionProductIds: readonly string[],
): void {
  const visibleProductIds = new Set(
    field.controls.productIds.getRawValue() ?? collectionProductIds,
  );
  const overrides = field.controls.labelOverrides;

  for (let index = overrides.length - 1; index >= 0; index -= 1) {
    const productId = overrides.at(index).controls.productId.getRawValue();
    if (visibleProductIds.has(productId)) continue;

    overrides.removeAt(index);
    overrides.markAsDirty();
  }
}

function syncCommercialComparisonFieldReferences(
  form: CommercialProductCollectionBlockEditorForm,
): void {
  const availableFieldIds = new Set(
    form.controls.fields.controls.map((field) =>
      field.controls.id.getRawValue()
    ),
  );

  for (const section of form.controls.presentation.controls.sections.controls) {
    const rows = section.controls.rows;

    for (let index = rows.length - 1; index >= 0; index -= 1) {
      const row = rows.at(index);
      const fieldIds = row.controls.fieldIds.getRawValue();
      const nextFieldIds = fieldIds.filter((fieldId) =>
        availableFieldIds.has(fieldId)
      );

      if (nextFieldIds.length === fieldIds.length) continue;

      if (nextFieldIds.length === 0) {
        rows.removeAt(index);
        rows.markAsDirty();
        continue;
      }

      row.controls.fieldIds.setValue(nextFieldIds);
      row.controls.fieldIds.markAsDirty();
    }
  }
}
