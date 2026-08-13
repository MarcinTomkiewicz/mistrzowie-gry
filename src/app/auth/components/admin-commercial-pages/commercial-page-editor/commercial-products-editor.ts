import { Component, input, signal } from '@angular/core';
import { FormArray } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import { COMMERCIAL_PRODUCT_KINDS } from '../../../../core/configs/commercial-pages.config';
import { mapPriceEditorForm } from '../../../../core/factories/price-editor-form.factory';
import {
  createCommercialProductEditorForm,
  mapCommercialProductEditorForm,
} from '../../../../core/factories/commercial-product-editor-form.factory';
import type { ISelectOption } from '../../../../core/interfaces/i-select-option';
import type { CommercialConstantAdminItem } from '../../../../core/types/commercial-constant-admin';
import type { CommercialProductKind } from '../../../../core/types/commercial-page-builder';
import type {
  CommercialProductEditorForm,
  CommercialSectionEditorForm,
} from '../../../../core/types/commercial-page-editor-form';
import { formatDuration } from '../../../../core/utils/duration-format';
import {
  formatNumber,
  formatOptionalNumberRange,
} from '../../../../core/utils/number-format';
import { formatPrice } from '../../../../core/utils/price-format';
import { createCommonPriceI18n } from '../../../../core/translations/common.i18n';
import { createCommercialPageI18n } from '../../../../core/translations/commercial-pages.i18n';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import {
  removeCommercialIncludedAddonReferences,
  removeCommercialProductReferences,
} from './commercial-product-references';
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
  protected readonly priceI18n = createCommonPriceI18n();
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
    const value = mapCommercialProductEditorForm(editorForm, position);
    const previousKind = editingIndex === null
      ? null
      : products.at(editingIndex).controls.kind.getRawValue();
    const product = createCommercialProductEditorForm(value);

    if (editingIndex === null) {
      products.push(product);
    } else {
      products.setControl(editingIndex, product);
    }

    if (previousKind === 'addon' && value.kind === 'product') {
      removeCommercialIncludedAddonReferences(products, value.id);
    }

    products.markAsDirty();
    this.closeEditor();
  }

  protected removeProduct(index: number): void {
    const products = this.products();
    const productId = products.at(index).controls.id.getRawValue();

    removeCommercialProductReferences(
      this.products(),
      this.sections(),
      productId,
    );
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

  protected productGroups() {
    const labels = this.i18n.products();
    const groupLabels: Record<CommercialProductKind, string> = {
      product: labels.products,
      addon: labels.addons,
    };

    return COMMERCIAL_PRODUCT_KINDS.map((kind) => ({
      kind,
      label: groupLabels[kind],
      items: this.products().controls.flatMap((form, index) =>
        form.controls.kind.getRawValue() === kind ? [{ form, index }] : [],
      ),
    }));
  }

  protected addonOptions(): ISelectOption<string>[] {
    const editedProductId = this.editorForm()?.controls.id.getRawValue();

    return this.products().controls.flatMap((product) => {
      const id = product.controls.id.getRawValue();
      if (
        product.controls.kind.getRawValue() !== 'addon' ||
        id === editedProductId
      ) {
        return [];
      }

      return [{
        value: id,
        label: product.controls.name.getRawValue() || id,
      }];
    });
  }

  protected productPrice(product: CommercialProductEditorForm) {
    return formatPrice(
      mapPriceEditorForm(product.controls.price),
      this.priceI18n().presentation,
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
      : formatDuration(
          minutes,
          this.commercialI18n.productValues().duration,
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

  protected productSessions(product: CommercialProductEditorForm): string {
    const mode = product.controls.sessionsMode.getRawValue();
    if (mode === 'not_applicable') return this.i18n.sessionMode()[mode];

    const count = product.controls.sessionsCount.getRawValue();
    if (count === null) return this.i18n.commonValues().notAvailable;

    return `${this.i18n.sessionMode()[mode]}: ${
      formatNumber(count, this.locale())
    }`;
  }

  protected productIncludedAddons(
    product: CommercialProductEditorForm,
  ): string | null {
    if (product.controls.kind.getRawValue() === 'addon') return null;

    const addonIds = product.controls.includedAddonIds.getRawValue();
    if (!addonIds.length) return null;

    return addonIds.map((addonId) => {
      const addon = this.products().controls.find((candidate) =>
        candidate.controls.id.getRawValue() === addonId &&
        candidate.controls.kind.getRawValue() === 'addon'
      );

      if (!addon) {
        throw new TypeError(`Missing page-local commercial addon: ${addonId}`);
      }

      return addon.controls.name.getRawValue();
    }).join(', ');
  }

  private formatParticipants(
    min: number | null,
    max: number | null,
    perFacilitatorMax: number | null = null,
  ): string {
    const range = formatOptionalNumberRange(
      min,
      max,
      this.commercialI18n.productValues(),
      this.locale(),
    );

    const perFacilitator = formatOptionalNumberRange(
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
