import { Component, input, signal } from '@angular/core';
import { FormArray } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import { COMMERCIAL_PRODUCT_KINDS } from '../../../../core/configs/commercial-pages.config';
import type { CommercialPagePublicationIssueIndex } from '../../../../core/domain/commercial-pages/commercial-page-publication-issues';
import {
  createCommercialProductEditorForm,
  mapCommercialProductEditorForm,
} from '../../../../core/factories/commercial-product-editor-form.factory';
import type { ISelectOption } from '../../../../core/interfaces/i-select-option';
import type { CommercialConstantAdminItem } from '../../../../core/types/commercial-constant-admin';
import type {
  CommercialProductEditorForm,
  CommercialSectionEditorForm,
} from '../../../../core/types/commercial-page-editor-form';
import type { CommercialProductKind } from '../../../../core/types/commercial-product';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import {
  removeCommercialIncludedAddonReferences,
  removeCommercialProductReferences,
} from './commercial-product-references';
import { CommercialProductEditor } from './commercial-product-editor';
import { CommercialProductSummary } from './commercial-product-summary';
import { CommercialPublicationIssueMessages } from './commercial-publication-issue-messages';

@Component({
  selector: 'app-commercial-products-editor',
  imports: [
    ButtonModule,
    DialogModule,
    CommercialProductEditor,
    CommercialProductSummary,
    CommercialPublicationIssueMessages,
  ],
  templateUrl: './commercial-products-editor.html',
})
export class CommercialProductsEditor {
  readonly products = input.required<FormArray<CommercialProductEditorForm>>();
  readonly diagnostics = input.required<CommercialPagePublicationIssueIndex>();
  readonly sections = input.required<FormArray<CommercialSectionEditorForm>>();
  readonly tokens = input<readonly string[]>([]);
  readonly constants = input<readonly CommercialConstantAdminItem[]>([]);
  readonly locale = input.required<string>();

  protected readonly i18n = createAdminCommercialPagesI18n();
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
      product: this.i18n.commonLabels().products,
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
}
