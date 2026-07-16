import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { provideTranslocoScope } from '@jsverse/transloco';

import { catchError, finalize, of } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';

import {
  OfferItemKindEnum,
  OfferPageTypeEnum,
  OfferSectionTypeEnum,
} from '../../../core/enums/offers';
import { SITE_URL } from '../../../core/config/site';
import { Offer } from '../../../core/services/offer/offer';
import { ResponseStatus } from '../../../core/services/response-status/response-status';
import { Seo } from '../../../core/services/seo/seo';
import type { OfferItemId, OfferPageVm } from '../../../core/types/offers';
import { normalizeFaqItems } from './faq-items';
import { createPageStructuredData } from '../../../core/utils/structured-data';
import {
  formatAddonPricing,
  formatPricing,
  formatPricingDetailed,
} from './offer-pricing';
import { LoadingOverlay } from '../../common/loading-overlay/loading-overlay';
import { createOffersI18n } from './offers.i18n';
import { StandardsAndLogistics } from './standards-and-logistics/standards-and-logistics';
import { findCardsSectionByKind, findSectionByType } from './offers.utils';

const STANDARDS_AND_LOGISTICS_SLUG = 'standardy-i-logistyka';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [
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
export class Offers implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly offer = inject(Offer);
  private readonly responseStatus = inject(ResponseStatus);
  private readonly seo = inject(Seo);
  private readonly siteUrl = SITE_URL;

  readonly i18n = createOffersI18n();

  private readonly slug$ = this.route.paramMap.pipe(
    map((pm) => pm.get('slug') ?? 'oferta-indywidualna'),
    distinctUntilChanged(),
  );

  readonly slug = signal('oferta-indywidualna');
  readonly offerPage = signal<OfferPageVm | null>(null);
  readonly isLoading = signal(true);
  readonly hasLoadError = signal(false);
  readonly isNotFound = signal(false);

  private readonly applySeoEffect = effect(() => {
    const requestedCanonicalUrl = `${this.siteUrl}/offer/${this.slug()}`;

    if (this.isLoading()) {
      this.seo.apply({
        title: this.i18n.commonStatus().loading,
        canonicalUrl: requestedCanonicalUrl,
        robots: 'noindex,nofollow',
      });
      return;
    }

    if (this.hasLoadError()) {
      this.seo.apply({
        title: this.i18n.commonErrors().server,
        canonicalUrl: requestedCanonicalUrl,
        robots: 'noindex,nofollow',
      });
      return;
    }

    if (this.isNotFound()) {
      this.seo.apply({
        title: this.i18n.commonErrors().notFound,
        canonicalUrl: requestedCanonicalUrl,
        robots: 'noindex,nofollow',
      });
      return;
    }

    const offerPage = this.offerPage();
    if (!offerPage) return;

    this.seo.apply({
      title: offerPage.page.seo.title?.trim() || offerPage.page.title,
      description:
        offerPage.page.seo.description?.trim() ||
        offerPage.page.subtitle ||
        '',
      canonicalUrl:
        offerPage.page.seo.canonicalUrl?.trim() ||
        `${this.siteUrl}/offer/${offerPage.page.slug}`,
      og: {
        title:
          offerPage.page.seo.ogTitle?.trim() ||
          offerPage.page.seo.title?.trim() ||
          offerPage.page.title,
        description:
          offerPage.page.seo.ogDescription?.trim() ||
          offerPage.page.seo.description?.trim() ||
          offerPage.page.subtitle ||
          '',
      },
      structuredData: this.buildCollectionStructuredData(offerPage),
    });
  });

  readonly pageVm = computed(() => {
    const vm = this.offerPage();
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

  ngOnInit(): void {
    this.slug$
      .pipe(
        switchMap((slug) => {
          this.startLoading(slug);

          return this.offer.getOfferPageVmBySlug(slug).pipe(
            catchError((error: unknown) => {
              console.error('[offers] Failed to load public offer page.', error);
              this.hasLoadError.set(true);
              this.responseStatus.set(503);

              return of(null);
            }),
            finalize(() => this.isLoading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((offerPage) => {
        this.offerPage.set(offerPage);

        if (this.hasLoadError()) return;

        this.isNotFound.set(!offerPage);
        this.responseStatus.set(offerPage ? 200 : 404);
      });
  }

  private startLoading(slug: string): void {
    this.slug.set(slug);
    this.isLoading.set(true);
    this.hasLoadError.set(false);
    this.isNotFound.set(false);
    this.offerPage.set(null);
    this.expandedLeadIds.set(new Set());
  }

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
