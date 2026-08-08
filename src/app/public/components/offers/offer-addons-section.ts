import { Component, input } from '@angular/core';

import type { OfferSectionWithItems } from '../../../core/types/offers';
import { OfferItemCards } from './offer-item-cards';

@Component({
  selector: 'app-offer-addons-section',
  imports: [OfferItemCards],
  templateUrl: './offer-addons-section.html',
})
export class OfferAddonsSection {
  readonly section = input.required<OfferSectionWithItems>();
  readonly pricingFootnote = input<string | null>(null);
}
