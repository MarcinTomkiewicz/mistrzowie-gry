import { CommonModule } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';

import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';

import { provideTranslocoScope } from '@jsverse/transloco';

import { createOffersI18n } from '../offers.i18n';

import type {
  OfferItemId,
  OfferSectionWithItems,
} from '../../../../core/types/offers';
import {
  formatPricingDetailed,
} from '../../../../core/utils/pricing';

@Component({
  selector: 'app-standards-and-logistics',
  standalone: true,
  imports: [CommonModule, AccordionModule, ButtonModule],
  templateUrl: './standards-and-logistics.html',
  styleUrl: './standards-and-logistics.scss',
  providers: [provideTranslocoScope('offers', 'common')],
})
export class StandardsAndLogistics {
  readonly logisticsSection = input<OfferSectionWithItems | null>(null);
  readonly pricingFootnote = input<string | null>(null);

  readonly i18n = createOffersI18n();

  readonly formatPricingDetailed = formatPricingDetailed;

  readonly expandedLeadIds = signal<Set<OfferItemId>>(new Set());

  readonly isLeadExpanded = (id: OfferItemId) => this.expandedLeadIds().has(id);

  readonly toggleLead = (id: OfferItemId) => {
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

  readonly shouldShowLeadToggle = (text?: string | null) =>
    !!text && text.trim().length > 180;

  readonly vm = computed(() => {
    const block = this.i18n.standardsAndLogistics();
    const logisticsSection = this.logisticsSection();

    return {
      intro: block?.intro ?? { title: '', subtitle: '' },

      standard: {
        title: block?.standard?.title ?? '',
        subtitle: block?.standard?.subtitle ?? '',
        items: Array.isArray(block?.standard?.items) ? block.standard.items : [],
      },

      logistics: {
        title: logisticsSection?.title ?? '',
        subtitle: logisticsSection?.subtitle ?? '',
        items: Array.isArray(logisticsSection?.items)
          ? logisticsSection.items
          : [],
      },

      faq: {
        title: block?.faq?.title ?? '',
        subtitle: block?.faq?.subtitle ?? '',
        items: Array.isArray(block?.faq?.items) ? block.faq.items : [],
      },
    };
  });
}