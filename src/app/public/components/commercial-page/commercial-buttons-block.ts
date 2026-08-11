import { NgClass } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import type {
  CommercialButtonsBlock as CommercialButtonsBlockModel,
} from '../../../core/types/commercial-page-builder';
import { CommercialActionLink } from './commercial-action-link';

const flexAlign = {
  left: 'start',
  center: 'center',
  right: 'end',
} as const;

@Component({
  selector: 'app-commercial-buttons-block',
  imports: [NgClass, CommercialActionLink],
  host: { class: 'd-block' },
  templateUrl: './commercial-buttons-block.html',
})
export class CommercialButtonsBlock {
  readonly block = input.required<CommercialButtonsBlockModel>();

  protected readonly layoutClass = computed(() => {
    const block = this.block();
    const align = flexAlign[block.align];

    return block.layout === 'horizontal'
      ? `flex-row-${align}-center flex-wrap`
      : `flex-col-start-${align}`;
  });
}
