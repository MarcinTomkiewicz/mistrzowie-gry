import { Component, input } from '@angular/core';
import { FormArray } from '@angular/forms';

import { ButtonModule } from 'primeng/button';

import { createCommercialProductEditorForm } from '../../../../core/factories/commercial-product-editor-form.factory';
import type {
  CommercialProductEditorForm,
  CommercialSectionEditorForm,
} from '../../../../core/types/commercial-page-editor-form';
import { removeCommercialProductReferences } from '../../../../core/utils/commercial-product-collection-editor';
import { moveFormArrayControl } from '../../../../core/utils/form-controls';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { CommercialItemEditorActions } from './commercial-item-editor-actions';
import { CommercialProductEditor } from './commercial-product-editor';

@Component({
  selector: 'app-commercial-products-editor',
  imports: [ButtonModule, CommercialItemEditorActions, CommercialProductEditor],
  templateUrl: './commercial-products-editor.html',
})
export class CommercialProductsEditor {
  readonly products = input.required<FormArray<CommercialProductEditorForm>>();
  readonly sections = input.required<FormArray<CommercialSectionEditorForm>>();
  readonly tokens = input<readonly string[]>([]);

  protected readonly i18n = createAdminCommercialPagesI18n();

  protected addProduct(): void {
    const products = this.products();
    products.push(createCommercialProductEditorForm());
    products.markAsDirty();
  }

  protected removeProduct(index: number): void {
    const products = this.products();
    const productId = products.at(index).controls.id.getRawValue();

    removeCommercialProductReferences(this.sections(), productId);
    products.removeAt(index);
    products.markAsDirty();
  }

  protected moveProduct(index: number, offset: -1 | 1): void {
    moveFormArrayControl(this.products(), index, index + offset);
  }
}
