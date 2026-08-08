import { Component, input } from '@angular/core';
import { TableModule } from 'primeng/table';

import type { CommercialPricingItem } from '../../../core/types/commercial-page';
import type { CommercialPrice } from '../../../core/types/commercial-price';
import { formatCommercialPrice } from '../../../core/utils/commercial-pricing';
import { ExpandableText } from '../../common/expandable-text/expandable-text';
import { CommercialItemDetails } from './commercial-item-details';
import { createCommercialPageI18n } from './commercial-page.i18n';

@Component({
  selector: 'app-commercial-pricing-table',
  imports: [TableModule, ExpandableText, CommercialItemDetails],
  templateUrl: './commercial-pricing-table.html',
})
export class CommercialPricingTable {
  readonly items = input.required<CommercialPricingItem[]>();
  readonly locale = input.required<string>();

  protected readonly i18n = createCommercialPageI18n();

  protected formatPrice(price: CommercialPrice) {
    return formatCommercialPrice(price, this.i18n.pricing(), this.locale());
  }
}
