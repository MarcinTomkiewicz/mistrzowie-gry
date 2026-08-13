import { Component, computed, input } from '@angular/core';

import { provideTranslocoScope } from '@jsverse/transloco';

import type { OfferSectionWithItems } from '../../../../core/types/offers';
import { FaqAccordion } from '../../../../common/faq-accordion/faq-accordion';
import { OfferItemCards } from '../offer-item-cards';
import { createOffersI18n } from '../offers.i18n';

@Component({
  selector: 'app-standards-and-logistics',
  standalone: true,
  imports: [FaqAccordion, OfferItemCards],
  templateUrl: './standards-and-logistics.html',
  providers: [provideTranslocoScope('offers', 'common')],
})
export class StandardsAndLogistics {
  readonly logisticsSection = input<OfferSectionWithItems | null>(null);
  readonly pricingFootnote = input<string | null>(null);

  readonly i18n = createOffersI18n();

  readonly vm = computed(() => {
    const block = this.i18n.standardsAndLogistics();
    const logisticsSection = this.logisticsSection();

    return {
      intro: block.intro,
      standard: block.standard,

      logistics: {
        title: logisticsSection?.title ?? '',
        subtitle: logisticsSection?.subtitle ?? '',
        items: logisticsSection?.items ?? [],
      },

      faq: block.faq,
    };
  });
}
