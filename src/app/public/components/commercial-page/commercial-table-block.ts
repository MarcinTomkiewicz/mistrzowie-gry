import { Component, input } from '@angular/core';

import { TableModule } from 'primeng/table';

import type {
  CommercialTableBlock as CommercialTableBlockModel,
  CommercialTableRow,
} from '../../../core/types/commercial-page-builder';
import type { RichContent as RichContentModel } from '../../../core/types/rich-content';
import { RichContent } from '../../common/rich-content/rich-content';

@Component({
  selector: 'app-commercial-table-block',
  imports: [TableModule, RichContent],
  host: { class: 'd-block' },
  templateUrl: './commercial-table-block.html',
})
export class CommercialTableBlock {
  readonly block = input.required<CommercialTableBlockModel>();

  protected cellContent(
    row: CommercialTableRow,
    columnId: string,
  ): RichContentModel {
    const cell = row.cells.find((candidate) => candidate.columnId === columnId);

    if (!cell) {
      throw new TypeError(`Missing commercial table cell: ${columnId}`);
    }

    return cell.content;
  }
}
