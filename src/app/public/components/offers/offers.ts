// path: src/app/features/offers/offers.ts
import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { provideTranslocoScope, translateObjectSignal } from '@jsverse/transloco';

import { Offer } from '../../../core/services/offer/offer';
import { pickTranslations } from '../../../core/utils/pick-translation';

import { AccordionModule } from 'primeng/accordion';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { OfferPageTypeEnum } from '../../../core/enums/offers';

import { normalizeFaqItems } from '../../../core/utils/display-items';
import { formatAddonPricing, formatPricing, formatPricingDetailed } from '../../../core/utils/pricing';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AccordionModule,
    CardModule,
    ButtonModule,
    TableModule,
  ],
  templateUrl: './offers.html',
  styleUrl: './offers.scss',
  providers: [provideTranslocoScope('offers'), provideTranslocoScope('common')],
})
export class Offers {
  private readonly route = inject(ActivatedRoute);
  private readonly offer = inject(Offer);

  private readonly slug$ = this.route.paramMap.pipe(
    map((pm) => pm.get('slug') ?? 'oferta-indywidualna'),
    distinctUntilChanged(),
  );

  readonly vm = toSignal(
    this.slug$.pipe(switchMap((slug) => this.offer.getOfferPageVmBySlug(slug))),
    { initialValue: null },
  );

  // i18n (offers scope)
  private readonly pricingHeadersDict = translateObjectSignal('pricingTable.headers', {}, { scope: 'offers' });

  // i18n (common scope)
  private readonly commonCtaDict = translateObjectSignal('cta', {}, { scope: 'common' });
  private readonly commonStatusDict = translateObjectSignal('status', {}, { scope: 'common' });
  private readonly commonEmptyDict = translateObjectSignal('empty', {}, { scope: 'common' });
  private readonly commonFootnotesDict = translateObjectSignal('footnotes', {}, { scope: 'common' });

  readonly pricingHeaders = pickTranslations(this.pricingHeadersDict, [
    'variant',
    'price',
    'description',
  ] as const);

  readonly commonCta = pickTranslations(this.commonCtaDict, ['contactUs'] as const);
  readonly commonStatus = pickTranslations(this.commonStatusDict, ['loading'] as const);
  readonly commonEmpty = pickTranslations(this.commonEmptyDict, ['title', 'description'] as const);
  readonly commonFootnotes = pickTranslations(this.commonFootnotesDict, ['net', 'gross'] as const);

  readonly pageVm = computed(() => {
    const vm = this.vm();
    if (!vm) return null;

    const findByType = (type: string) => vm.sections.find((s: any) => s.type === type) ?? null;
    const findCardsByKind = (kind: string) =>
      vm.sections.find((s: any) => s.type === 'cards' && s.itemKind === kind) ?? null;

    const faqSection = findByType('faq') as any;
    const faqItems = normalizeFaqItems(faqSection?.display?.items);

    const pageType = vm.page?.type as string | undefined;
    const isNet = pageType === OfferPageTypeEnum.Business || pageType === OfferPageTypeEnum.Institution;

    return {
      page: vm.page,

      hero: findByType('hero'),
      pricing: findByType('pricingTable') ?? findByType('pricing_table'),

      addon: findCardsByKind('addon'),
      material: findCardsByKind('material'),

      faq: {
        section: faqSection,
        items: faqItems,
      },

      cta: findByType('cta'),

      pricingFootnote: isNet ? this.commonFootnotes().net : this.commonFootnotes().gross,
    };
  });

  readonly formatPricing = formatPricing;
  readonly formatPricingDetailed = formatPricingDetailed;
  readonly formatAddonPricing = formatAddonPricing;
}