import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { provideTranslocoScope } from '@jsverse/transloco';

import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';

import {
  OfferItemKindEnum,
  OfferPageTypeEnum,
  OfferSectionTypeEnum,
} from '../../../core/enums/offers';
import { Offer } from '../../../core/services/offer/offer';
import { Seo } from '../../../core/services/seo/seo';
import type { OfferItem, OfferPageSection } from '../../../core/types/offers';
import { normalizeFaqItems } from '../../../core/utils/display-items';
import {
  formatAddonPricing,
  formatPricing,
  formatPricingDetailed,
} from '../../../core/utils/pricing';
import { createOffersI18n } from './offers.i18n';
import { findCardsSectionByKind, findSectionByType } from './offers.utils';

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
  private readonly seo = inject(Seo);

  readonly i18n = createOffersI18n();

  private readonly slug$ = this.route.paramMap.pipe(
    map((pm) => pm.get('slug') ?? 'oferta-indywidualna'),
    distinctUntilChanged(),
  );

  readonly vm = toSignal(
    this.slug$.pipe(switchMap((slug) => this.offer.getOfferPageVmBySlug(slug))),
    { initialValue: null },
  );

  private readonly applySeoEffect = effect(() => {
    const vm = this.vm();

    if (!vm) {
      this.seo.apply({
        title: this.i18n.seo().title || 'Chaotyczne Czwartki',
        description: this.i18n.seo().description || '',
      });
      return;
    }

    this.seo.apply({
      title: vm.page.seo.title?.trim() || vm.page.title,
      description: vm.page.seo.description?.trim() || vm.page.subtitle || '',
      canonicalUrl: vm.page.seo.canonicalUrl?.trim() || undefined,
      og: {
        title:
          vm.page.seo.ogTitle?.trim() ||
          vm.page.seo.title?.trim() ||
          vm.page.title,
        description:
          vm.page.seo.ogDescription?.trim() ||
          vm.page.seo.description?.trim() ||
          vm.page.subtitle ||
          '',
      },
    });
  });

  readonly pageVm = computed(() => {
    const vm = this.vm();
    if (!vm) return null;

    const sections = vm.sections as OfferVmSection[];

    const hero = findSectionByType(sections, OfferSectionTypeEnum.Hero);
    const pricing = findSectionByType(
      sections,
      OfferSectionTypeEnum.PricingTable,
    );

    const addon = findCardsSectionByKind(sections, OfferItemKindEnum.Addon);
    const material = findCardsSectionByKind(
      sections,
      OfferItemKindEnum.Material,
    );

    const faqSection = findSectionByType(sections, OfferSectionTypeEnum.Faq);
    const faqItems = normalizeFaqItems(faqSection?.display['items']);

    const cta = findSectionByType(sections, OfferSectionTypeEnum.Cta);

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
