import { Component, computed, input } from '@angular/core';

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

  protected readonly cards = computed(() =>
    this.products().map((product) => {
      const fields = commercialFieldsForProduct(
        this.block().fields,
        product.id,
      );
      const priceField = fields.find((field) => field.key === 'price') ?? null;
      const descriptionField =
        fields.find((field) => field.key === 'description') ?? null;
      const nameVisible = fields.some((field) => field.key === 'name');

      return {
        product,
        nameVisible,
        priceField,
        descriptionField,
        hasPrimaryContent: nameVisible || !!priceField || !!descriptionField,
        metadataFields: fields.filter(
          (field) =>
            field.key !== 'name' &&
            field.key !== 'price' &&
            field.key !== 'description',
        ),
      };
    }),
  );

  protected labelFor(
    field: CommercialProductField,
    product: CommercialRenderProduct,
  ): string {
    return commercialProductFieldLabel(
      field,
      product.id,
      this.i18n.productFieldLabel(field.key),
    );
  }
}
