import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { provideTranslocoScope } from '@jsverse/transloco';

import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';

import { OfferPageTypeEnum } from '../../../core/enums/offers';
import { Offer } from '../../../core/services/offer/offer';
import { normalizeFaqItems } from '../../../core/utils/display-items';
import {
  formatAddonPricing,
  formatPricing,
  formatPricingDetailed,
} from '../../../core/utils/pricing';
import {
  findCardsSectionByKind,
  findSectionByType,
} from './offers.utils';
import { createOffersI18n } from './offers.i18n';
import type { OfferItem, OfferPageSection } from '../../../core/types/offers';

type OfferVmSection = OfferPageSection & { items: OfferItem[] };

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AccordionModule,
    ButtonModule,
    TableModule,
  ],
  templateUrl: './offers.html',
  styleUrl: './offers.scss',
  providers: [provideTranslocoScope('offers', 'common')],
})
export class Offers {
  private readonly route = inject(ActivatedRoute);
  private readonly offer = inject(Offer);

  readonly i18n = createOffersI18n();

  private readonly slug$ = this.route.paramMap.pipe(
    map((pm) => pm.get('slug') ?? 'oferta-indywidualna'),
    distinctUntilChanged(),
  );

  readonly vm = toSignal(
    this.slug$.pipe(
      switchMap((slug) => this.offer.getOfferPageVmBySlug(slug)),
    ),
    { initialValue: null },
  );

  readonly pageVm = computed(() => {
    const vm = this.vm();
    if (!vm) return null;

    const sections = vm.sections as OfferVmSection[];

    const hero = findSectionByType(sections, 'hero');
    const pricing =
      findSectionByType(sections, 'pricingTable') ??
      findSectionByType(sections, 'pricing_table');

    const addon = findCardsSectionByKind(sections, 'addon');
    const material = findCardsSectionByKind(sections, 'material');

    const faqSection = findSectionByType(sections, 'faq');
    const faqItems = normalizeFaqItems(faqSection?.display['items']);

    const cta = findSectionByType(sections, 'cta');

    const pageType = vm.page?.type;
    const isNet =
      pageType === OfferPageTypeEnum.Business ||
      pageType === OfferPageTypeEnum.Institution;

    return {
      page: vm.page,
      hero,
      pricing,
      addon,
      material,
      faq: {
        section: faqSection,
        items: faqItems,
      },
      cta,
      pricingFootnote: isNet
        ? this.i18n.commonFootnotes().net
        : this.i18n.commonFootnotes().gross,
    };
  });

  readonly formatPricing = formatPricing;
  readonly formatPricingDetailed = formatPricingDetailed;
  readonly formatAddonPricing = formatAddonPricing;
}