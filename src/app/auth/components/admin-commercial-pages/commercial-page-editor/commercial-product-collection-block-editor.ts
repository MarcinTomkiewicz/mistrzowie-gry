import { Component, computed, input, signal } from '@angular/core';
import { FormArray, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';

import {
  COMMERCIAL_CARD_ORIENTATIONS,
  COMMERCIAL_PRODUCT_CARD_COLUMNS,
  COMMERCIAL_PRODUCT_COLLECTION_PRESENTATIONS,
  COMMERCIAL_PRODUCT_FIELD_KEYS,
  COMMERCIAL_PRODUCT_KINDS,
} from '../../../../core/configs/commercial-pages.config';
import {
  syncCommercialProductCollectionPresentationControls,
} from '../../../../core/factories/commercial-block-editor-form.factory';
import {
  createCommercialProductFieldEditorForm,
  createCommercialProductLabelOverrideEditorForm,
} from '../../../../core/factories/commercial-block-item-editor-form.factory';
import type {
  CommercialProductCollectionBlockEditorForm,
  CommercialProductFieldEditorForm,
} from '../../../../core/types/commercial-builder-block-editor-form';
import type { CommercialProductKind } from '../../../../core/types/commercial-page-builder';
import type { CommercialProductOption } from '../../../../core/types/commercial-page-editor';
import type { CommercialProductEditorForm } from '../../../../core/types/commercial-page-editor-form';
import type { CommercialProductFieldLabelsTranslations } from '../../../../core/types/i18n/commercial-pages';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import {
  moveFormArrayControl,
  moveFormControlArrayItem,
} from '../../../../core/utils/form-controls';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import {
  syncCommercialProductCollectionReferences,
  syncCommercialProductFieldReferences,
} from './commercial-product-references';
import { ItemEditorActions } from '../../../../common/item-editor-actions/item-editor-actions';
import { CommercialProductComparisonEditor } from './commercial-product-comparison-editor';

@Component({
  selector: 'app-commercial-product-collection-block-editor',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
    ItemEditorActions,
    CommercialProductComparisonEditor,
  ],
  templateUrl: './commercial-product-collection-block-editor.html',
})
export class CommercialProductCollectionBlockEditor {
  readonly form = input.required<CommercialProductCollectionBlockEditorForm>();
  readonly products = input.required<FormArray<CommercialProductEditorForm>>();
  readonly controlId = input.required<string>();

  protected readonly i18n = createAdminCommercialPagesI18n();
  protected readonly productFieldLabels = createScopedSectionsI18n<{
    productFieldKey: CommercialProductFieldLabelsTranslations;
  }>('commercialPages', { productFieldKey: 'productFieldKey' })
    .productFieldKey;
  protected readonly customizedFieldIds = signal<ReadonlySet<string>>(
    new Set(),
  );
  protected readonly presentationOptions = computed(() => {
    const labels = this.i18n.collectionPresentation();
    return COMMERCIAL_PRODUCT_COLLECTION_PRESENTATIONS.map((value) => ({
      value,
      label: labels[value],
    }));
  });
  protected readonly orientationOptions = computed(() => {
    const labels = this.i18n.cardOrientation();
    return COMMERCIAL_CARD_ORIENTATIONS.map((value) => ({
      value,
      label: labels[value],
    }));
  });
  protected readonly fieldKeyOptions = computed(() => {
    const labels = this.productFieldLabels();
    return COMMERCIAL_PRODUCT_FIELD_KEYS.map((value) => ({
      value,
      label: labels[value],
    }));
  });
  protected readonly columnOptions = COMMERCIAL_PRODUCT_CARD_COLUMNS.map(
    (value) => ({ value, label: String(value) }),
  );

  protected productOptions(): CommercialProductOption[] {
    return this.products().controls.map((product) => ({
      value: product.controls.id.getRawValue(),
      label:
        product.controls.name.getRawValue() ||
        product.controls.id.getRawValue(),
      kind: product.controls.kind.getRawValue(),
    }));
  }

  protected productOptionGroups() {
    return this.groupProductOptions(this.productOptions());
  }

  protected collectionProductOptions() {
    const collectionIds = new Set(
      this.form().controls.productIds.getRawValue(),
    );
    return this.productOptions().filter((option) =>
      collectionIds.has(option.value),
    );
  }

  protected collectionProductOptionGroups() {
    return this.groupProductOptions(this.collectionProductOptions());
  }

  protected productLabel(productId: string): string {
    const option = this.productOptions().find(
      (candidate) => candidate.value === productId,
    );

    if (!option) {
      throw new TypeError(
        `Missing page-local commercial product: ${productId}`,
      );
    }

    return option.label;
  }

  protected availableOverrideOptions(
    field: CommercialProductFieldEditorForm,
    currentProductId: string | null = null,
  ) {
    const visibleIds = new Set(
      field.controls.productIds.getRawValue() ??
        this.form().controls.productIds.getRawValue(),
    );
    const usedIds = new Set(
      field.controls.labelOverrides.controls
        .map((override) => override.controls.productId.getRawValue())
        .filter((productId) => productId !== currentProductId),
    );

    return this.collectionProductOptions().filter((option) =>
      visibleIds.has(option.value) && !usedIds.has(option.value),
    );
  }

  protected canAddLabelOverride(
    field: CommercialProductFieldEditorForm,
  ): boolean {
    return this.availableOverrideOptions(field).length > 0;
  }

  protected syncPresentation(): void {
    syncCommercialProductCollectionPresentationControls(this.form());
  }

  protected syncCollection(): void {
    syncCommercialProductCollectionReferences(this.form());
  }

  protected removeProduct(index: number): void {
    const control = this.form().controls.productIds;
    const productIds = [...control.getRawValue()];
    productIds.splice(index, 1);
    control.setValue(productIds);
    control.markAsDirty();
    this.syncCollection();
  }

  protected moveProduct(index: number, offset: -1 | 1): void {
    moveFormControlArrayItem(
      this.form().controls.productIds,
      index,
      index + offset,
    );
  }

  protected syncField(field: CommercialProductFieldEditorForm): void {
    syncCommercialProductFieldReferences(
      field,
      this.form().controls.productIds.getRawValue(),
    );
  }

  protected addField(): void {
    const fields = this.form().controls.fields;
    const field = createCommercialProductFieldEditorForm();

    fields.push(field);
    fields.markAsDirty();
  }
  protected removeField(index: number): void {
    const fields = this.form().controls.fields;
    fields.removeAt(index);
    fields.markAsDirty();
    this.syncCollection();
  }
  protected moveField(index: number, offset: -1 | 1): void {
    moveFormArrayControl(this.form().controls.fields, index, index + offset);
  }
  protected addLabelOverride(field: CommercialProductFieldEditorForm): void {
    const selectedId = this.availableOverrideOptions(field)[0]?.value;
    if (!selectedId) return;

    field.controls.labelOverrides.push(
      createCommercialProductLabelOverrideEditorForm(selectedId),
    );
    field.controls.labelOverrides.markAsDirty();
  }
  protected removeLabelOverride(
    field: CommercialProductFieldEditorForm,
    index: number,
  ): void {
    field.controls.labelOverrides.removeAt(index);
    field.controls.labelOverrides.markAsDirty();
  }

  protected applyDefaultFieldLabel(
    field: CommercialProductFieldEditorForm,
  ): void {
    field.controls.label.setValue(null);
    field.controls.label.markAsDirty();
  }

  protected fieldLabel(field: CommercialProductFieldEditorForm): string {
    return field.controls.label.getRawValue() ??
      this.productFieldLabels()[field.controls.key.getRawValue()];
  }

  protected isFieldCustomized(
    field: CommercialProductFieldEditorForm,
  ): boolean {
    return this.customizedFieldIds().has(field.controls.id.getRawValue());
  }

  protected toggleFieldCustomization(
    field: CommercialProductFieldEditorForm,
  ): void {
    const id = field.controls.id.getRawValue();
    const nextIds = new Set(this.customizedFieldIds());

    if (nextIds.has(id)) {
      nextIds.delete(id);
    } else {
      nextIds.add(id);
    }

    this.customizedFieldIds.set(nextIds);
  }

  private groupProductOptions(options: CommercialProductOption[]) {
    const labels = this.i18n.products();

    const groupLabels: Record<CommercialProductKind, string> = {
      product: labels.products,
      addon: labels.addons,
    };

    return COMMERCIAL_PRODUCT_KINDS.map((kind) => ({
      label: groupLabels[kind],
      items: options.filter((option) => option.kind === kind),
    })).filter((group) => group.items.length > 0);
  }
}
