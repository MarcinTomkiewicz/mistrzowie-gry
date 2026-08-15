import { Component, computed, input } from '@angular/core';

import {
  createCommonLabelsI18n,
  createCommonPriceI18n,
} from '../../core/translations/common.i18n';
import type { Price } from '../../core/types/price';
import { formatPrice } from '../../core/utils/price-format';

@Component({
  selector: 'app-price-value',
  host: { class: 'd-block' },
  templateUrl: './price-value.html',
})
export class PriceValue {
  readonly price = input.required<Price>();
  readonly locale = input.required<string>();
  readonly accent = input(false);

  private readonly i18n = createCommonPriceI18n();
  private readonly labels = createCommonLabelsI18n();

  protected readonly formatted = computed(() =>
    formatPrice(
      this.price(),
      this.i18n().presentation,
      this.labels().fromLowercase,
      this.locale(),
    ),
  );
}
