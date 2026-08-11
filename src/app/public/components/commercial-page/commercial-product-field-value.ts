import { Component, computed, input } from '@angular/core';

import type {
  CommercialProductField,
  CommercialRenderProduct,
} from '../../../core/types/commercial-page-builder';
import { formatCommercialProductField } from '../../../core/utils/commercial-product-fields';
import { RichContent } from '../../common/rich-content/rich-content';
import { CommercialPriceValue } from './commercial-price-value';
import { createCommercialPageI18n } from './commercial-page.i18n';

@Component({
  selector: 'app-commercial-product-field-value',
  imports: [RichContent, CommercialPriceValue],
  host: { class: 'd-block' },
  templateUrl: './commercial-product-field-value.html',
})
export class CommercialProductFieldValue {
  readonly product = input.required<CommercialRenderProduct>();
  readonly field = input.required<CommercialProductField>();
  readonly locale = input.required<string>();

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
