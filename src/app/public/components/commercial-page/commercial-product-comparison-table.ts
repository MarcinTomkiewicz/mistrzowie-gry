import { Component, input } from '@angular/core';

import { TableModule } from 'primeng/table';

import type {
  CommercialProductCollectionComparisonTableBlock as CommercialProductComparisonTableBlockModel,
  CommercialComparisonRow,
  CommercialProductField,
  CommercialRenderProduct,
} from '../../../core/types/commercial-page-builder';
import { selectCommercialProductFields } from '../../../core/utils/commercial-product-collection';
import { CommercialProductComparisonValue } from './commercial-product-comparison-value';

@Component({
  selector: 'app-commercial-product-comparison-table',
  imports: [TableModule, CommercialProductComparisonValue],
  host: { class: 'd-block' },
  templateUrl: './commercial-product-comparison-table.html',
})
export class CommercialProductComparisonTable {
  readonly block =
    input.required<CommercialProductComparisonTableBlockModel>();
  readonly products = input.required<readonly CommercialRenderProduct[]>();
  readonly locale = input.required<string>();

  protected fieldsForRow(
    row: CommercialComparisonRow,
  ): CommercialProductField[] {
    return selectCommercialProductFields(
      row.fieldIds,
      this.block().fields,
    );
  }
}
