import { Component, input } from '@angular/core';

import { provideTranslocoScope } from '@jsverse/transloco';
import { TableModule } from 'primeng/table';

import type { OfferSectionWithItems } from '../../../core/types/offers';
import { ExpandableText } from '../../common/expandable-text/expandable-text';
import { formatPricing } from './offer-pricing';
import { createOffersI18n } from './offers.i18n';

@Component({
  selector: 'app-offer-pricing-section',
  imports: [TableModule, ExpandableText],
  templateUrl: './offer-pricing-section.html',
  providers: [provideTranslocoScope('offers', 'common')],
})
export class OfferPricingSection {
  readonly section = input.required<OfferSectionWithItems>();
  readonly pricingFootnote = input<string | null>(null);

  readonly i18n = createOffersI18n();
  readonly formatPricing = formatPricing;
}
