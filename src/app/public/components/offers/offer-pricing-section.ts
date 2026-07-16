import { Component, input, signal } from '@angular/core';

import { provideTranslocoScope } from '@jsverse/transloco';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import type {
  OfferItemId,
  OfferSectionWithItems,
} from '../../../core/types/offers';
import { formatPricing } from './offer-pricing';
import { createOffersI18n } from './offers.i18n';

@Component({
  selector: 'app-offer-pricing-section',
  imports: [ButtonModule, TableModule],
  templateUrl: './offer-pricing-section.html',
  styleUrl: './offer-pricing-section.scss',
  providers: [provideTranslocoScope('offers', 'common')],
})
export class OfferPricingSection {
  readonly section = input.required<OfferSectionWithItems>();
  readonly pricingFootnote = input<string | null>(null);

  readonly i18n = createOffersI18n();
  readonly formatPricing = formatPricing;
  private readonly expandedLeadIds = signal<Set<OfferItemId>>(new Set());

  readonly isLeadExpanded = (id: OfferItemId): boolean =>
    this.expandedLeadIds().has(id);

  readonly toggleLead = (id: OfferItemId): void => {
    this.expandedLeadIds.update((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  readonly shouldShowLeadToggle = (text?: string | null): boolean =>
    !!text && text.trim().length > 180;
}
