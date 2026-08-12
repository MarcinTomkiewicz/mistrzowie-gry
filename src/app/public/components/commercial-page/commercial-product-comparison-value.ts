import { Component, computed, input } from '@angular/core';

import type {
  CommercialProductField,
  CommercialRenderProduct,
} from '../../../core/types/commercial-page-builder';
import {
  commercialProductFieldLabel,
  isCommercialProductFieldVisible,
} from '../../../core/utils/commercial-product-collection';
import { CommercialProductFieldValue } from './commercial-product-field-value';
import { createCommercialPageI18n } from './commercial-page.i18n';

@Component({
  selector: 'app-commercial-product-comparison-value',
  imports: [CommercialProductFieldValue],
  host: { class: 'd-block' },
  templateUrl: './commercial-product-comparison-value.html',
})
export class CommercialProductComparisonValue {
  readonly product = input.required<CommercialRenderProduct>();
  readonly fields = input.required<readonly CommercialProductField[]>();
  readonly locale = input.required<string>();

  private readonly i18n = createCommercialPageI18n();

  protected readonly visibleFields = computed(() =>
    this.fields().filter((field) =>
      isCommercialProductFieldVisible(field, this.product().id)
    ),
  );
  protected readonly composite = computed(() => this.fields().length > 1);

  protected label(field: CommercialProductField): string {
    return commercialProductFieldLabel(
      field,
      this.product().id,
      field.label ?? this.i18n.productFieldKey()[field.key],
    );
  }
}
