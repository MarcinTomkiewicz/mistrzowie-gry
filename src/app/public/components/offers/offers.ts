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
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
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
import type { BreadcrumbItem } from '../../../core/types/breadcrumb';
import type { OfferItem, OfferPageVm } from '../../../core/types/offers';
import {
  createBreadcrumbStructuredData,
  createPageStructuredData,
} from '../../../core/utils/structured-data';
import { Breadcrumbs } from '../../common/breadcrumbs/breadcrumbs';
import { LoadingOverlay } from '../../common/loading-overlay/loading-overlay';
import { OfferAddonsSection } from './offer-addons-section';
import { OfferFaqSection } from './offer-faq-section';
import { OfferMaterialsSection } from './offer-materials-section';
import { OfferPricingSection } from './offer-pricing-section';
import { createOffersI18n } from './offers.i18n';
import { StandardsAndLogistics } from './standards-and-logistics/standards-and-logistics';
import {
  findCardsSectionByKind,
  findSectionByType,
  normalizeFaqItems,
} from './offers.utils';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [
    RouterModule,
    ButtonModule,
    Breadcrumbs,
    LoadingOverlay,
    OfferAddonsSection,
    OfferFaqSection,
    OfferMaterialsSection,
    OfferPricingSection,
    StandardsAndLogistics,
  ],
  templateUrl: './offers.html',
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

  readonly slug = signal(
    this.route.snapshot.paramMap.get('slug') ?? 'oferta-indywidualna',
  );
  readonly offerPage = signal<OfferPageVm | null>(null);
  readonly isLoading = signal(true);
  readonly hasLoadError = signal(false);
  readonly isNotFound = signal(false);
  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const offerPage = this.offerPage();

    if (!offerPage) {
      return [];
    }

    return [
      {
        label: this.i18n.commonCta().goHome,
        path: '/',
      },
      {
        label: offerPage.page.title,
      },
    ];
  });

  private readonly applySeoEffect = effect(() => {
    const requestedCanonicalUrl = `${this.siteUrl}/offer/${this.slug()}`;

    if (this.isLoading()) {
      const fallbackSeo = this.i18n.commonSeo();

      this.seo.apply({
        title: fallbackSeo.defaultTitle,
        description: fallbackSeo.defaultDescription,
        canonicalUrl: requestedCanonicalUrl,
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
      structuredData: [
        this.buildCollectionStructuredData(offerPage),
        createBreadcrumbStructuredData(this.breadcrumbs()),
      ],
    });
  });

  readonly pageVm = computed(() => {
    const vm = this.offerPage();
    if (!vm) return null;

    const sections = vm.sections;
    const isStandardsAndLogisticsPage =
      vm.page.type === OfferPageTypeEnum.StandardsAndLogistics;

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

    const footnotes = this.i18n.commonFootnotes();
    let pricingFootnote: string;

    switch (vm.page.type) {
      case OfferPageTypeEnum.Business:
      case OfferPageTypeEnum.Institution:
        pricingFootnote = footnotes.net;
        break;
      case OfferPageTypeEnum.StandardsAndLogistics:
        pricingFootnote = footnotes.both;
        break;
      default:
        pricingFootnote = footnotes.gross;
    }

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
  }

  private buildCollectionStructuredData(vm: OfferPageVm) {
    const canonicalUrl =
      vm.page.seo.canonicalUrl?.trim() || `${this.siteUrl}/offer/${vm.page.slug}`;

    const uniqueItems = new Map<OfferItem['id'], OfferItem>();

    for (const section of vm.sections) {
      for (const item of section.items) {
        if (!uniqueItems.has(item.id)) {
          uniqueItems.set(item.id, item);
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
        itemListElement: Array.from(uniqueItems.values()).map(
          (item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.title,
            description: item.lead ?? undefined,
          }),
        ),
      },
    });
  }
}
