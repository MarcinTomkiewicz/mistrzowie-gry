import { Component, computed, input } from '@angular/core';

import type {
  CommercialProductField,
  CommercialRenderProduct,
} from '../../core/types/commercial-page-builder';
import { formatCommercialProductField } from '../../core/domain/commercial-pages/commercial-product-fields';
import { createCommercialPageI18n } from '../../core/translations/commercial-pages.i18n';
import { ExpandableText } from '../expandable-text/expandable-text';
import { PriceValue } from '../price-value/price-value';

@Component({
  selector: 'app-commercial-product-field-value',
  imports: [ExpandableText, PriceValue],
  host: { class: 'd-block' },
  templateUrl: './commercial-product-field-value.html',
})
export class CommercialProductFieldValue {
  readonly product = input.required<CommercialRenderProduct>();
  readonly field = input.required<CommercialProductField>();
  readonly locale = input.required<string>();
  readonly priceAccent = input(false);

  private readonly i18n = createCommercialPageI18n();

  protected readonly presentation = computed(() =>
    formatCommercialProductField(
      this.product(),
      this.field().key,
      this.i18n.productValues(),
      this.locale(),
    ),
  );
}
