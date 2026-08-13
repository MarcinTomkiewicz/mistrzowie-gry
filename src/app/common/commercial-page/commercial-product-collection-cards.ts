import { Component, input } from '@angular/core';

import type {
  CommercialProductCollectionCardsBlock as CommercialProductCollectionCardsBlockModel,
  CommercialProductField,
  CommercialRenderProduct,
} from '../../core/types/commercial-page-builder';
import {
  commercialFieldsForProduct,
  commercialProductFieldLabel,
} from '../../core/domain/commercial-pages/commercial-product-collection';
import { createCommercialPageI18n } from '../../core/translations/commercial-pages.i18n';
import { CommercialProductFieldValue } from './commercial-product-field-value';

@Component({
  selector: 'app-commercial-product-collection-cards',
  imports: [CommercialProductFieldValue],
  host: { class: 'd-block' },
  templateUrl: './commercial-product-collection-cards.html',
})
export class CommercialProductCollectionCards {
  readonly block =
    input.required<CommercialProductCollectionCardsBlockModel>();
  readonly products = input.required<readonly CommercialRenderProduct[]>();
  readonly locale = input.required<string>();
  private readonly i18n = createCommercialPageI18n();

  protected fieldsFor(
    product: CommercialRenderProduct,
  ): CommercialProductField[] {
    return commercialFieldsForProduct(this.block().fields, product.id);
  }

  protected labelFor(
    field: CommercialProductField,
    product: CommercialRenderProduct,
  ): string {
    return commercialProductFieldLabel(
      field,
      product.id,
      this.i18n.productFieldKey()[field.key],
    );
  }
}
