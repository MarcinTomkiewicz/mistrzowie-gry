import { Component, input } from '@angular/core';

import type { OfferSectionWithItems } from '../../../core/types/offers';
import { OfferItemCards } from './offer-item-cards';

@Component({
  selector: 'app-offer-materials-section',
  imports: [OfferItemCards],
  templateUrl: './offer-materials-section.html',
})
export class OfferMaterialsSection {
  readonly section = input.required<OfferSectionWithItems>();
}
