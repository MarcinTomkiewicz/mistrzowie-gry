import { NgClass } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import type {
  CommercialButtonsBlock as CommercialButtonsBlockModel,
} from '../../core/types/commercial-page-builder';
import { CommercialActionLink } from './commercial-action-link';

@Component({
  selector: 'app-commercial-buttons-block',
  imports: [NgClass, CommercialActionLink],
  host: { class: 'd-block' },
  templateUrl: './commercial-buttons-block.html',
})
export class CommercialButtonsBlock {
  readonly block = input.required<CommercialButtonsBlockModel>();

  protected readonly layoutClass = computed(() => {
    const presentation = this.block().presentation;
    let align: 'start' | 'center' | 'end';

    switch (presentation.align) {
      case 'left':
        align = 'start';
        break;
      case 'center':
        align = 'center';
        break;
      case 'right':
        align = 'end';
        break;
    }

    return presentation.layout === 'horizontal'
      ? `flex-row-${align}-center flex-wrap`
      : `flex-col-start-${align}`;
  });
}
