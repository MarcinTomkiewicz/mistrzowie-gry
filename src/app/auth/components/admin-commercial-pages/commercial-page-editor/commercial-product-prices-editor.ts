import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';

import { ItemEditorActions } from '../../../../common/item-editor-actions/item-editor-actions';
import { PriceEditor } from '../../../../common/price-editor/price-editor';
import { createCommercialProductPriceEditorForm } from '../../../../core/factories/commercial-product-price-editor-form.factory';
import type { CommercialProductEditorForm } from '../../../../core/types/commercial-page-editor-form';
import { moveFormArrayControl } from '../../../../core/utils/form-controls';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';

@Component({
  selector: 'app-commercial-product-prices-editor',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CheckboxModule,
    IftaLabelModule,
    InputTextModule,
    ItemEditorActions,
    PriceEditor,
  ],
  templateUrl: './commercial-product-prices-editor.html',
})
export class CommercialProductPricesEditor {
  readonly form = input.required<CommercialProductEditorForm>();
  readonly controlId = input.required<string>();

  protected readonly i18n = createAdminCommercialPagesI18n();

  protected addPrice(): void {
    const prices = this.form().controls.prices;
    prices.push(createCommercialProductPriceEditorForm());
    prices.markAsDirty();
  }

  protected removePrice(index: number): void {
    const prices = this.form().controls.prices;
    prices.removeAt(index);
    prices.markAsDirty();
  }

  protected movePrice(index: number, offset: -1 | 1): void {
    moveFormArrayControl(this.form().controls.prices, index, index + offset);
  }
}
