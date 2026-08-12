import { Component, computed, input } from '@angular/core';

import { TableModule } from 'primeng/table';

import type {
  CommercialProductCollectionComparisonTableBlock as CommercialProductComparisonTableBlockModel,
  CommercialProductField,
  CommercialRenderProduct,
} from '../../../core/types/commercial-page-builder';
import {
  commercialFieldsForProduct,
  commercialProductFieldLabel,
  isCommercialProductFieldVisible,
} from '../../../core/utils/commercial-product-collection';
import { CommercialProductFieldValue } from './commercial-product-field-value';
import { createCommercialPageI18n } from './commercial-page.i18n';

@Component({
  selector: 'app-commercial-product-comparison-table',
  imports: [TableModule, CommercialProductFieldValue],
  host: { class: 'd-block' },
  templateUrl: './commercial-product-comparison-table.html',
})
export class CommercialProductComparisonTable {
  readonly block =
    input.required<CommercialProductComparisonTableBlockModel>();
  readonly products = input.required<readonly CommercialRenderProduct[]>();
  readonly locale = input.required<string>();
  private readonly i18n = createCommercialPageI18n();

  protected readonly comparisonFields = computed(() =>
    this.block().fields.filter((field) => field.key !== 'name'),
  );

  protected isVisible(
    field: CommercialProductField,
    product: CommercialRenderProduct,
  ): boolean {
    return isCommercialProductFieldVisible(field, product.id);
  }

  protected fieldsFor(
    product: CommercialRenderProduct,
  ): CommercialProductField[] {
    return commercialFieldsForProduct(this.block().fields, product.id).filter(
      (field) => field.key !== 'name',
    );
  }

  protected nameFieldsFor(
    product: CommercialRenderProduct,
  ): CommercialProductField[] {
    return commercialFieldsForProduct(this.block().fields, product.id).filter(
      (field) => field.key === 'name',
    );
  }

  protected labelFor(
    field: CommercialProductField,
    product: CommercialRenderProduct,
  ): string {
    return commercialProductFieldLabel(
      field,
      product.id,
      this.defaultLabel(field),
    );
  }

  protected defaultLabel(field: CommercialProductField): string {
    return field.label ?? this.i18n.productFieldKey()[field.key];
  }
}
