// path: src/app/features/offers/offers.ts
import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';

import {
  provideTranslocoScope,
  translateObjectSignal,
} from '@jsverse/transloco';

import { Offer } from '../../../core/services/offer/offer';
import { pickTranslations } from '../../../core/utils/pick-translation';

import { AccordionModule } from 'primeng/accordion';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';

type AnyDict = Record<string, any>;

type PricingFormatted = {
  value: string;
  note?: string;
};

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
  private readonly pricingHeadersDict = translateObjectSignal(
    'pricingTable.headers',
    {},
    { scope: 'offers' },
  );

  // i18n (common scope)
  private readonly commonCtaDict = translateObjectSignal(
    'cta',
    {},
    { scope: 'common' },
  );
  private readonly commonStatusDict = translateObjectSignal(
    'status',
    {},
    { scope: 'common' },
  );
  private readonly commonEmptyDict = translateObjectSignal(
    'empty',
    {},
    { scope: 'common' },
  );

  readonly pricingHeaders = pickTranslations(this.pricingHeadersDict, [
    'variant',
    'price',
    'description',
  ] as const);

  readonly commonCta = pickTranslations(this.commonCtaDict, [
    'contactUs',
  ] as const);
  readonly commonStatus = pickTranslations(this.commonStatusDict, [
    'loading',
  ] as const);
  readonly commonEmpty = pickTranslations(this.commonEmptyDict, [
    'title',
    'description',
  ] as const);

  private normalizeFaqItems(
    itemsUnknown: unknown,
  ): Array<{ h: string; a: string }> {
    if (!itemsUnknown) return [];
    if (Array.isArray(itemsUnknown))
      return itemsUnknown as Array<{ h: string; a: string }>;
    if (typeof itemsUnknown === 'object')
      return Object.values(itemsUnknown as AnyDict) as Array<{
        h: string;
        a: string;
      }>;
    return [];
  }

  readonly pageVm = computed(() => {
    const vm = this.vm();
    if (!vm) return null;

    const findByType = (type: string) =>
      vm.sections.find((s: any) => s.type === type) ?? null;
    const findCardsByKind = (kind: string) =>
      vm.sections.find((s: any) => s.type === 'cards' && s.itemKind === kind) ??
      null;

    const faqSection = findByType('faq') as any;
    const faqItems = this.normalizeFaqItems(faqSection?.display?.items);

    return {
      page: vm.page,

      hero: findByType('hero'),
      pricing: findByType('pricingTable') ?? findByType('pricing_table'), // safe if someone didn't camelCase section.type

      addon: findCardsByKind('addon'),
      material: findCardsByKind('material'),

      faq: {
        section: faqSection,
        items: faqItems,
      },

      cta: findByType('cta'),
    };
  });

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    if (typeof value === 'string') {
      const n = Number(value);
      return Number.isNaN(n) ? null : n;
    }
    return null;
  }

  private formatMoney(value: unknown, currency: string): string | null {
    const n = this.toNumber(value);
    if (n === null) return null;
    const decimals = n % 1 === 0 ? 0 : 2;
    return `${n.toFixed(decimals)} ${currency}`;
  }

  private formatRange(
    min: unknown,
    max: unknown,
    currency: string,
  ): string | null {
    const minStr = this.formatMoney(min, currency);
    const maxStr = this.formatMoney(max, currency);
    if (!minStr || !maxStr) return null;
    return `${minStr} – ${maxStr}`;
  }

  formatPricing(pricing: unknown): string {
    return this.formatPricingDetailed(pricing)?.value ?? '';
  }

  formatPricingDetailed(pricing: unknown): PricingFormatted | null {
    if (!pricing || typeof pricing !== 'object') return null;

    const p = pricing as AnyDict;

    const currency = typeof p['currency'] === 'string' ? p['currency'] : 'PLN';

    const note =
      typeof p['pricingNote'] === 'string' ? p['pricingNote'] : undefined;

    const netSuffix = p['net'] === true ? ' netto' : '';

    const formatRange = (minKey: string, maxKey: string, monthly = false) => {
      const minStr = this.formatMoney(p[minKey], currency);
      const maxStr = this.formatMoney(p[maxKey], currency);
      if (!minStr || !maxStr) return null;
      const base = `${minStr} – ${maxStr}${netSuffix}`;
      return monthly ? `${base} / miesiąc` : base;
    };

    // 1) ranges
    const range = formatRange('min', 'max');
    if (range) return { value: range, note };

    const monthlyRange = formatRange('monthlyMin', 'monthlyMax', true);
    if (monthlyRange) return { value: monthlyRange, note };

    // 2) totals
    const total = this.formatMoney(p['total'], currency);
    if (total) return { value: `${total}${netSuffix}`, note };

    const monthly = this.formatMoney(p['monthly'], currency);
    if (monthly) return { value: `${monthly}${netSuffix} / miesiąc`, note };

    // 3) rates
    const perHour = this.formatMoney(p['perHour'], currency);
    if (perHour) return { value: `${perHour}${netSuffix} / h`, note };

    const unit = this.formatMoney(p['unit'], currency);
    if (unit) {
      const unitLabel =
        typeof p['unitLabel'] === 'string' ? p['unitLabel'] : '';
      return {
        value: unitLabel
          ? `${unit}${netSuffix} / ${unitLabel}`
          : `${unit}${netSuffix}`,
        note,
      };
    }

    // 4) minimum / surcharge / percent
    const minTotal = this.formatMoney(p['minTotal'], currency);
    if (minTotal) return { value: `od ${minTotal}${netSuffix}`, note };

    const surcharge = this.formatMoney(p['surcharge'], currency);
    if (surcharge) return { value: `+${surcharge}${netSuffix}`, note };

    const percent = this.toNumber(p['percentSurcharge']);
    if (percent !== null) return { value: `+${percent}%${netSuffix}`, note };

    try {
      return { value: JSON.stringify(pricing), note };
    } catch {
      return null;
    }
  }

  /**
   * Addons: show "+" for *absolute* amounts that are add-ons.
   * Do NOT prepend "+" to ranges ("1200–1800") or minimums ("od 100").
   */
  formatAddonPricing(pricing: unknown): PricingFormatted | null {
    const base = this.formatPricingDetailed(pricing);
    if (!base) return null;

    if (base.value.startsWith('+')) return base;
    if (base.value.startsWith('od ')) return base;
    if (base.value.includes('–')) return base; // range
    if (base.value.includes('%')) return base; // percent already includes +...% in detailed, but keep safe

    return { value: `+${base.value}`, note: base.note };
  }
}
