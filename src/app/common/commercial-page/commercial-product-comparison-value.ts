import { Component, computed, input } from '@angular/core';

import type {
  CommercialProductField,
  CommercialRenderProduct,
} from '../../core/types/commercial-page-builder';
import {
  commercialProductFieldLabel,
  isCommercialProductFieldVisible,
} from '../../core/domain/commercial-pages/commercial-product-collection';
import { createCommercialPageI18n } from '../../core/translations/commercial-pages.i18n';
import { CommercialProductFieldValue } from './commercial-product-field-value';

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
      field.label ?? this.i18n.productFieldLabel(field.key),
    );
  }
}
