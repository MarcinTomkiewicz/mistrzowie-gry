import { Component, input, signal } from '@angular/core';
import { FormArray } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import { mapCommercialPriceEditorForm } from '../../../../core/factories/commercial-price-editor-form.factory';
import {
  createCommercialProductEditorForm,
  mapCommercialProductEditorForm,
} from '../../../../core/factories/commercial-product-editor-form.factory';
import type { CommercialConstantAdminItem } from '../../../../core/types/commercial-constant-admin';
import type {
  CommercialProductEditorForm,
  CommercialSectionEditorForm,
} from '../../../../core/types/commercial-page-editor-form';
import { removeCommercialProductReferences } from '../../../../core/utils/commercial-product-collection-editor';
import {
  formatCommercialDuration,
  formatCommercialOptionalNumberRange,
} from '../../../../core/utils/commercial-product-fields';
import { formatCommercialPrice } from '../../../../core/utils/commercial-pricing';
import { createCommercialPageI18n } from '../../../../public/components/commercial-page/commercial-page.i18n';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { CommercialProductEditor } from './commercial-product-editor';

@Component({
  selector: 'app-commercial-products-editor',
  imports: [ButtonModule, DialogModule, CommercialProductEditor],
  templateUrl: './commercial-products-editor.html',
})
export class CommercialProductsEditor {
  readonly products = input.required<FormArray<CommercialProductEditorForm>>();
  readonly sections = input.required<FormArray<CommercialSectionEditorForm>>();
  readonly tokens = input<readonly string[]>([]);
  readonly constants = input<readonly CommercialConstantAdminItem[]>([]);
  readonly locale = input.required<string>();

  protected readonly i18n = createAdminCommercialPagesI18n();
  protected readonly commercialI18n = createCommercialPageI18n();
  protected readonly editorForm = signal<CommercialProductEditorForm | null>(
    null,
  );
  protected readonly editingIndex = signal<number | null>(null);

  protected addProduct(): void {
    this.editingIndex.set(null);
    this.editorForm.set(createCommercialProductEditorForm());
  }

  protected editProduct(index: number): void {
    const product = this.products().at(index);
    const value = mapCommercialProductEditorForm(product, (index + 1) * 10);

    this.editingIndex.set(index);
    this.editorForm.set(createCommercialProductEditorForm(value));
  }

  protected saveProduct(): void {
    const editorForm = this.editorForm();
    if (!editorForm) return;

    editorForm.markAllAsTouched();
    if (editorForm.invalid) return;

    const products = this.products();
    const editingIndex = this.editingIndex();
    const position = ((editingIndex ?? products.length) + 1) * 10;
    const product = createCommercialProductEditorForm(
      mapCommercialProductEditorForm(editorForm, position),
    );

    if (editingIndex === null) {
      products.push(product);
    } else {
      products.setControl(editingIndex, product);
    }

    products.markAsDirty();
    this.closeEditor();
  }

  protected removeProduct(index: number): void {
    const products = this.products();
    const productId = products.at(index).controls.id.getRawValue();

    removeCommercialProductReferences(this.sections(), productId);
    products.removeAt(index);
    products.markAsDirty();
  }

  protected closeEditor(): void {
    this.editorForm.set(null);
    this.editingIndex.set(null);
  }

  protected onDialogVisibleChange(visible: boolean): void {
    if (!visible) this.closeEditor();
  }

  protected productPrice(product: CommercialProductEditorForm) {
    return formatCommercialPrice(
      mapCommercialPriceEditorForm(product.controls.price),
      this.commercialI18n.pricing(),
      this.locale(),
    );
  }

  protected productDuration(product: CommercialProductEditorForm): string {
    const mode = product.controls.durationMode.getRawValue();

    if (mode === 'not_applicable') return this.i18n.durationMode()[mode];

    const minutes =
      mode === 'standard'
        ? this.numericConstant('duration', 'duration')
        : product.controls.durationMinutes.getRawValue();

    return minutes === null
      ? this.i18n.commonValues().notAvailable
      : formatCommercialDuration(
          minutes,
          this.commercialI18n.productValues(),
          this.locale(),
        );
  }

  protected productParticipants(
    product: CommercialProductEditorForm,
  ): string {
    const mode = product.controls.participantsMode.getRawValue();

    if (mode === 'not_applicable') return this.i18n.participantsMode()[mode];

    if (mode === 'standard') {
      const value = this.numericConstant('participants', 'integer');
      return value === null
        ? this.i18n.commonValues().notAvailable
        : this.formatParticipants(null, value);
    }

    const min = product.controls.participantsMin.getRawValue();
    const max = product.controls.participantsMax.getRawValue();
    const perFacilitatorMax =
      product.controls.participantsPerFacilitatorMax.getRawValue();

    return this.formatParticipants(min, max, perFacilitatorMax);
  }

  private formatParticipants(
    min: number | null,
    max: number | null,
    perFacilitatorMax: number | null = null,
  ): string {
    const range = formatCommercialOptionalNumberRange(
      min,
      max,
      this.commercialI18n.productValues(),
      this.locale(),
    );

    const perFacilitator = formatCommercialOptionalNumberRange(
      perFacilitatorMax,
      perFacilitatorMax,
      this.commercialI18n.productValues(),
      this.locale(),
    );

    if (!perFacilitator) {
      return range ?? this.i18n.commonValues().notAvailable;
    }

    const perFacilitatorSummary =
      `${this.i18n.product().participantsPerFacilitatorMax}: ${perFacilitator}`;

    return range ? `${range}; ${perFacilitatorSummary}` : perFacilitatorSummary;
  }

  private numericConstant(
    token: string,
    valueType: 'duration' | 'integer',
  ): number | null {
    const constant = this.constants().find(
      (candidate) =>
        candidate.token === token && candidate.valueType === valueType,
    );

    return constant && typeof constant.draftValue === 'number'
      ? constant.draftValue
      : null;
  }
}
