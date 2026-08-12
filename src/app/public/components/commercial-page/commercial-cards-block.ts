import { Component, computed, input } from '@angular/core';

import type {
  CommercialCardsBlock as CommercialCardsBlockModel,
} from '../../../core/types/commercial-page-builder';
import { RichContent } from '../../common/rich-content/rich-content';
import { CommercialPriceValue } from './commercial-price-value';

@Component({
  selector: 'app-commercial-cards-block',
  imports: [RichContent, CommercialPriceValue],
  host: { class: 'd-block' },
  templateUrl: './commercial-cards-block.html',
})
export class CommercialCardsBlock {
  readonly block = input.required<CommercialCardsBlockModel>();
  readonly locale = input.required<string>();
  readonly pricingFootnote = input.required<string | null>();

  protected readonly hasPrices = computed(() =>
    this.block().items.some((card) => card.price !== null),
  );
}
