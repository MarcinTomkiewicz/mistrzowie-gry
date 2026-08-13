import { Component, input } from '@angular/core';

import type {
  CommercialPageBlock as CommercialPageBlockModel,
  CommercialRenderProduct,
} from '../../core/types/commercial-page-builder';
import { RichContent } from '../rich-content/rich-content';
import { CommercialButtonsBlock } from './commercial-buttons-block';
import { CommercialCardsBlock } from './commercial-cards-block';
import { CommercialFaqBlock } from './commercial-faq-block';
import { CommercialProductCollection } from './commercial-product-collection';
import { CommercialTableBlock } from './commercial-table-block';

@Component({
  selector: 'app-commercial-page-block',
  imports: [
    RichContent,
    CommercialButtonsBlock,
    CommercialCardsBlock,
    CommercialFaqBlock,
    CommercialProductCollection,
    CommercialTableBlock,
  ],
  host: { class: 'd-block' },
  templateUrl: './commercial-page-block.html',
})
export class CommercialPageBlock {
  readonly block = input.required<CommercialPageBlockModel>();
  readonly products = input.required<readonly CommercialRenderProduct[]>();
  readonly locale = input.required<string>();
  readonly pricingFootnote = input.required<string | null>();
}
