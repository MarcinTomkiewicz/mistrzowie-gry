import { Component, computed, input } from '@angular/core';

import type {
  CommercialProductCollectionBlock as CommercialProductCollectionBlockModel,
  CommercialProductCollectionCardsBlock,
  CommercialProductCollectionComparisonTableBlock,
  CommercialProductCollectionTableBlock,
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
  protected readonly cardsBlock = computed(() => {
    const block = this.block();
    return isCardsBlock(block) ? block : null;
  });
  protected readonly tableBlock = computed(() => {
    const block = this.block();
    return isTableBlock(block) ? block : null;
  });
  protected readonly comparisonTableBlock = computed(() => {
    const block = this.block();
    return isComparisonTableBlock(block) ? block : null;
  });
  protected readonly hasPriceField = computed(() =>
    this.block().fields.some(
      (field) =>
        field.key === 'price' &&
        (field.productIds === null || field.productIds.length > 0),
    ),
  );
}

function isCardsBlock(
  block: CommercialProductCollectionBlockModel,
): block is CommercialProductCollectionCardsBlock {
  return block.presentation.type === 'cards';
}

function isTableBlock(
  block: CommercialProductCollectionBlockModel,
): block is CommercialProductCollectionTableBlock {
  return block.presentation.type === 'table';
}

function isComparisonTableBlock(
  block: CommercialProductCollectionBlockModel,
): block is CommercialProductCollectionComparisonTableBlock {
  return block.presentation.type === 'comparison_table';
}
