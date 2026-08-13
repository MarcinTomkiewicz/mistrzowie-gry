import { Component, computed, input } from '@angular/core';

import type {
  CommercialFaqBlock as CommercialFaqBlockModel,
} from '../../core/types/commercial-page-builder';
import type { FaqAccordionItem } from '../../core/types/faq-items';
import { FaqAccordion } from '../faq-accordion/faq-accordion';

@Component({
  selector: 'app-commercial-faq-block',
  imports: [FaqAccordion],
  host: { class: 'd-block' },
  template: `<app-faq-accordion [items]="items()" />`,
})
export class CommercialFaqBlock {
  readonly block = input.required<CommercialFaqBlockModel>();

  protected readonly items = computed<FaqAccordionItem[]>(() =>
    this.block().items.map((item) => ({
      h: item.question,
      a: item.answer,
    })),
  );
}
