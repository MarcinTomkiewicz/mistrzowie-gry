import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
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
import { SITE_URL } from '../../../core/config/site';
import { Offer } from '../../../core/services/offer/offer';
import { Seo } from '../../../core/services/seo/seo';
import type { OfferItemId, OfferPageVm } from '../../../core/types/offers';
import { normalizeFaqItems } from '../../../core/utils/display-items';
import { createPageStructuredData } from '../../../core/utils/structured-data';
import {
  formatAddonPricing,
  formatPricing,
  formatPricingDetailed,
} from '../../../core/utils/pricing';
import { LoadingOverlay } from '../../common/loading-overlay/loading-overlay';
import { createOffersI18n } from './offers.i18n';
import { StandardsAndLogistics } from './standards-and-logistics/standards-and-logistics';
import { findCardsSectionByKind, findSectionByType } from './offers.utils';

const STANDARDS_AND_LOGISTICS_SLUG = 'standardy-i-logistyka';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AccordionModule,
    ButtonModule,
    TableModule,
    LoadingOverlay,
    StandardsAndLogistics,
  ],
  templateUrl: './offers.html',
  styleUrl: './offers.scss',
  providers: [provideTranslocoScope('offers', 'common')],
})
export class Offers {
  private readonly route = inject(ActivatedRoute);
  private readonly offer = inject(Offer);
  private readonly seo = inject(Seo);
  private readonly siteUrl = SITE_URL;

  readonly i18n = createOffersI18n();

  private readonly slug$ = this.route.paramMap.pipe(
    map((pm) => pm.get('slug') ?? 'oferta-indywidualna'),
    distinctUntilChanged(),
  );

  private readonly slug = toSignal(this.slug$, {
    initialValue: 'oferta-indywidualna',
  });

  readonly vm = toSignal(
    this.slug$.pipe(switchMap((slug) => this.offer.getOfferPageVmBySlug(slug))),
    { initialValue: null },
  );

  private readonly resetExpandedLeadsEffect = effect(() => {
    this.slug();
    this.expandedLeadIds.set(new Set());
  });

  private readonly applySeoEffect = effect(() => {
    const vm = this.vm();

    if (!vm) {
      this.seo.apply({
        title: this.i18n.seo().title || 'Oferta',
        description: this.i18n.seo().description || '',
        canonicalUrl: `${this.siteUrl}/offer/${this.slug()}`,
      });
      return;
    }

    this.seo.apply({
      title: vm.page.seo.title?.trim() || vm.page.title,
      description: vm.page.seo.description?.trim() || vm.page.subtitle || '',
      canonicalUrl:
        vm.page.seo.canonicalUrl?.trim() ||
        `${this.siteUrl}/offer/${vm.page.slug}`,
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
      structuredData: this.buildCollectionStructuredData(vm),
    });
  });

  readonly pageVm = computed(() => {
    const vm = this.vm();
    if (!vm) return null;

    const sections = vm.sections;
    const isStandardsAndLogisticsPage =
      vm.page.slug === STANDARDS_AND_LOGISTICS_SLUG;

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
    const logistics = findCardsSectionByKind(
      sections,
      OfferItemKindEnum.Logistics,
    );

    const faqSection = findSectionByType(sections, OfferSectionTypeEnum.Faq);
    const faqItems = normalizeFaqItems(faqSection?.display['items']);

    const cta = findSectionByType(sections, OfferSectionTypeEnum.Cta);

    const pageType = vm.page?.type;

    const footnotes = this.i18n.commonFootnotes();

    const FOOTNOTE_BY_PAGE_TYPE: Partial<Record<OfferPageTypeEnum, string>> = {
      [OfferPageTypeEnum.Business]: footnotes.net,
      [OfferPageTypeEnum.Institution]: footnotes.net,
      [OfferPageTypeEnum.StandardsAndLogistics]: footnotes.both,
    };

    const pricingFootnote =
      FOOTNOTE_BY_PAGE_TYPE[pageType as OfferPageTypeEnum] ?? footnotes.gross;

    return {
      page: vm.page,
      isStandardsAndLogisticsPage,
      hero,
      pricing,
      addon,
      material,
      logistics,
      faq: {
        section: faqSection,
        items: faqItems,
      },
      cta,
      pricingFootnote,
    };
  });

  readonly formatPricing = formatPricing;
  readonly formatPricingDetailed = formatPricingDetailed;
  readonly formatAddonPricing = formatAddonPricing;

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

  private buildCollectionStructuredData(vm: OfferPageVm) {
    const canonicalUrl =
      vm.page.seo.canonicalUrl?.trim() || `${this.siteUrl}/offer/${vm.page.slug}`;

    const uniqueItems = new Map<number, { title: string; lead: string | null }>();

    for (const section of vm.sections) {
      for (const item of section.items) {
        if (!uniqueItems.has(item.id)) {
          uniqueItems.set(item.id, {
            title: item.title,
            lead: item.lead,
          });
        }
      }
    }

    return createPageStructuredData({
      type: 'CollectionPage',
      id: `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: vm.page.seo.title?.trim() || vm.page.title,
      description: vm.page.seo.description?.trim() || vm.page.subtitle || '',
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: Array.from(uniqueItems.entries()).map(
          ([id, item], index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${canonicalUrl}#offer-item-${id}`,
            name: item.title,
            description: item.lead ?? undefined,
          }),
        ),
      },
    });
  }
}
