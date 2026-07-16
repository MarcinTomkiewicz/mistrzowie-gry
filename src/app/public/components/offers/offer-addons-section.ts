import { Component, input, signal } from '@angular/core';

import { provideTranslocoScope } from '@jsverse/transloco';

import { ButtonModule } from 'primeng/button';

import { createCommonCtaI18n } from '../../../core/translations/common.i18n';
import type {
  OfferItemId,
  OfferSectionWithItems,
} from '../../../core/types/offers';
import { formatAddonPricing } from './offer-pricing';

@Component({
  selector: 'app-offer-addons-section',
  imports: [ButtonModule],
  templateUrl: './offer-addons-section.html',
  styleUrl: './offer-addons-section.scss',
  providers: [provideTranslocoScope('common')],
})
export class OfferAddonsSection {
  readonly section = input.required<OfferSectionWithItems>();
  readonly pricingFootnote = input<string | null>(null);

  readonly cta = createCommonCtaI18n();
  readonly formatAddonPricing = formatAddonPricing;
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
