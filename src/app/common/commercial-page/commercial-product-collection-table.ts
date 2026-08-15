import { Component, input } from '@angular/core';

import { TableModule } from 'primeng/table';

import type {
  CommercialProductCollectionTableBlock as CommercialProductCollectionTableBlockModel,
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
  selector: 'app-commercial-product-collection-table',
  imports: [TableModule, CommercialProductFieldValue],
  host: { class: 'd-block' },
  templateUrl: './commercial-product-collection-table.html',
})
export class CommercialProductCollectionTable {
  readonly block =
    input.required<CommercialProductCollectionTableBlockModel>();
  readonly products = input.required<CommercialRenderProduct[]>();
  readonly locale = input.required<string>();
  private readonly i18n = createCommercialPageI18n();

  protected label(
    field: CommercialProductField,
  ): string {
    return field.label ?? this.i18n.productFieldLabel(field.key);
  }

  protected isVisible(
    field: CommercialProductField,
    product: CommercialRenderProduct,
  ): boolean {
    return isCommercialProductFieldVisible(field, product.id);
  }

  protected overrideLabel(
    field: CommercialProductField,
    product: CommercialRenderProduct,
  ): string | null {
    const defaultLabel = this.label(field);
    const label = commercialProductFieldLabel(
      field,
      product.id,
      defaultLabel,
    );
    return label === defaultLabel ? null : label;
  }
}
