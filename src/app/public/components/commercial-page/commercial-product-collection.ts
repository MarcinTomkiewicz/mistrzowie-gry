import { Component, computed, input } from '@angular/core';

import type {
  CommercialProductCollectionBlock as CommercialProductCollectionBlockModel,
  CommercialRenderProduct,
} from '../../../core/types/commercial-page-builder';
import { selectCommercialProducts } from '../../../core/utils/commercial-product-collection';
import { CommercialProductCollectionCards } from './commercial-product-collection-cards';
import { CommercialProductCollectionTable } from './commercial-product-collection-table';
import { CommercialProductComparisonTable } from './commercial-product-comparison-table';

@Component({
  selector: 'app-commercial-product-collection',
  imports: [
    CommercialProductCollectionCards,
    CommercialProductCollectionTable,
    CommercialProductComparisonTable,
  ],
  host: { class: 'd-block' },
  templateUrl: './commercial-product-collection.html',
})
export class CommercialProductCollection {
  readonly block = input.required<CommercialProductCollectionBlockModel>();
  readonly products = input.required<readonly CommercialRenderProduct[]>();
  readonly locale = input.required<string>();
  readonly pricingFootnote = input.required<string | null>();

  protected readonly selectedProducts = computed(() =>
    selectCommercialProducts(this.block().productIds, this.products()),
  );
  protected readonly hasPriceField = computed(() =>
    this.block().fields.some(
      (field) => field.key === 'price' && field.productIds.length > 0,
    ),
  );
}
