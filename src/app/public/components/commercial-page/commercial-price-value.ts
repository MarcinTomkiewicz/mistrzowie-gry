import { Component, computed, input } from '@angular/core';

import type { CommercialPrice } from '../../../core/types/commercial-price';
import { formatCommercialPrice } from '../../../core/utils/commercial-pricing';
import { createCommercialPageI18n } from './commercial-page.i18n';

@Component({
  selector: 'app-commercial-price-value',
  host: { class: 'd-block' },
  templateUrl: './commercial-price-value.html',
})
export class CommercialPriceValue {
  readonly price = input.required<CommercialPrice>();
  readonly locale = input.required<string>();

  private readonly i18n = createCommercialPageI18n();

  protected readonly formatted = computed(() =>
    formatCommercialPrice(
      this.price(),
      this.i18n.pricing(),
      this.locale(),
    ),
  );
}
