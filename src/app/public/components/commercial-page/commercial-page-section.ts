import { Component, computed, input } from '@angular/core';

import type {
  CommercialFaqItem,
  CommercialPageSection as CommercialPageSectionModel,
} from '../../../core/types/commercial-page';
import type { DisplayFaqItem } from '../../../core/types/faq-items';
import { FaqAccordion } from '../../common/faq-accordion/faq-accordion';
import { RichContent } from '../../common/rich-content/rich-content';
import { CommercialActionLink } from './commercial-action-link';
import { CommercialCardItems } from './commercial-card-items';
import { CommercialPricingTable } from './commercial-pricing-table';
import { CommercialSectionHeader } from './commercial-section-header';

@Component({
  selector: 'app-commercial-page-section',
  imports: [
    FaqAccordion,
    RichContent,
    CommercialActionLink,
    CommercialCardItems,
    CommercialPricingTable,
    CommercialSectionHeader,
  ],
  host: { class: 'd-block' },
  templateUrl: './commercial-page-section.html',
})
export class CommercialPageSection {
  readonly section = input.required<CommercialPageSectionModel>();
  readonly locale = input.required<string>();
  readonly pricingFootnote = input.required<string | null>();

  protected readonly faqItems = computed<DisplayFaqItem[]>(() => {
    const section = this.section();

    return section.type === 'faq'
      ? section.items.map(this.toDisplayFaqItem)
      : [];
  });

  protected readonly hasCardPrices = computed(() => {
    const section = this.section();

    return (
      section.type === 'card_grid' &&
      section.items.some((item) => item.price !== null)
    );
  });

  private readonly toDisplayFaqItem = (
    item: CommercialFaqItem,
  ): DisplayFaqItem => ({
    h: item.question,
    a: item.answer,
  });
}
