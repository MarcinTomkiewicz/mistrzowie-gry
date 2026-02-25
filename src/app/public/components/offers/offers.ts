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

  private readonly slug =
    this.route.snapshot.paramMap.get('slug') ?? 'oferta-indywidualna';

  readonly vm = toSignal(this.offer.getOfferPageVmBySlug(this.slug), {
    initialValue: null,
  });

  readonly heroSection = computed(
    () => this.vm()?.sections.find((s) => s.type === 'hero') ?? null,
  );
  readonly pricingSection = computed(
    () => this.vm()?.sections.find((s) => s.type === 'pricing_table') ?? null,
  );

  readonly addonSection = computed(
    () =>
      this.vm()?.sections.find(
        (s) => s.type === 'cards' && s.itemKind === 'addon',
      ) ?? null,
  );

  readonly materialSection = computed(
    () =>
      this.vm()?.sections.find(
        (s) => s.type === 'cards' && s.itemKind === 'material',
      ) ?? null,
  );

  readonly faqSection = computed(
    () => this.vm()?.sections.find((s) => s.type === 'faq') ?? null,
  );
  readonly ctaSection = computed(
    () => this.vm()?.sections.find((s) => s.type === 'cta') ?? null,
  );

  // i18n (offers scope)
  private readonly labelsDict = translateObjectSignal('labels', {}, { scope: 'offers' });
  private readonly pricingHeadersDict = translateObjectSignal('pricingTable.headers', {}, { scope: 'offers' });

  // i18n (common scope)
  private readonly commonCtaDict = translateObjectSignal('cta', {}, { scope: 'common' });

  readonly labels = pickTranslations(this.labelsDict, ['loading'] as const);

  readonly pricingHeaders = pickTranslations(this.pricingHeadersDict, [
    'variant',
    'price',
    'description',
  ] as const);

  readonly commonCta = pickTranslations(this.commonCtaDict, ['contactUs'] as const);

  ngOnInit() {
    console.log(this.vm());
    
  }
}
