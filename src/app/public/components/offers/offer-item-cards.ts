import { Component, input } from '@angular/core';

import { OfferItemKindEnum } from '../../../core/enums/offers';
import type { OfferItem } from '../../../core/types/offers';
import { ExpandableText } from '../../../common/expandable-text/expandable-text';
import { formatAddonPricing, formatPricingDetailed } from './offer-pricing';

@Component({
  selector: 'app-offer-item-cards',
  imports: [ExpandableText],
  host: { class: 'd-block' },
  templateUrl: './offer-item-cards.html',
})
export class OfferItemCards {
  readonly items = input.required<readonly OfferItem[]>();

  protected readonly getPresentation = (item: OfferItem) => {
    switch (item.kind) {
      case OfferItemKindEnum.Addon:
        return {
          pricing: formatAddonPricing(item.pricing),
          pricingNoteInline: true,
          expandableLead: true,
          expandableIcon: 'pi pi-lever',
        };
      case OfferItemKindEnum.Material:
        return {
          pricing: formatPricingDetailed(item.pricing),
          pricingNoteInline: false,
          expandableLead: false,
          expandableIcon: undefined,
        };
      case OfferItemKindEnum.Logistics:
        return {
          pricing: formatPricingDetailed(item.pricing),
          pricingNoteInline: true,
          expandableLead: true,
          expandableIcon: undefined,
        };
      default:
        throw new Error(`Unsupported offer card item kind: ${item.kind}`);
    }
  };
}
