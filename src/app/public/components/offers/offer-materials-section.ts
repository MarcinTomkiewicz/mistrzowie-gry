import { Component, input } from '@angular/core';

import type { OfferSectionWithItems } from '../../../core/types/offers';
import { formatPricingDetailed } from './offer-pricing';

@Component({
  selector: 'app-offer-materials-section',
  templateUrl: './offer-materials-section.html',
  styleUrl: './offer-materials-section.scss',
})
export class OfferMaterialsSection {
  readonly section = input.required<OfferSectionWithItems>();
  readonly formatPricingDetailed = formatPricingDetailed;
}
