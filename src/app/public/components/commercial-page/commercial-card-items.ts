import { Component, input } from '@angular/core';

import type {
  CommercialCardItem,
  CommercialPricingItem,
} from '../../../core/types/commercial-page';
import type { CommercialPrice } from '../../../core/types/commercial-price';
import { formatCommercialPrice } from '../../../core/utils/commercial-pricing';
import { ExpandableText } from '../../common/expandable-text/expandable-text';
import { CommercialItemDetails } from './commercial-item-details';
import { createCommercialPageI18n } from './commercial-page.i18n';

@Component({
  selector: 'app-commercial-card-items',
  imports: [ExpandableText, CommercialItemDetails],
  templateUrl: './commercial-card-items.html',
})
export class CommercialCardItems {
  readonly items = input.required<
    readonly CommercialCardItem[] | readonly CommercialPricingItem[]
  >();
  readonly locale = input.required<string>();

  private readonly i18n = createCommercialPageI18n();

  protected formatPrice(price: CommercialPrice) {
    return formatCommercialPrice(price, this.i18n.pricing(), this.locale());
  }
}
