import { Component, input } from '@angular/core';

import { provideTranslocoScope } from '@jsverse/transloco';

import { createCommonEmptyI18n } from '../../../core/translations/common.i18n';
import type { DisplayFaqItem } from '../../../core/types/faq-items';
import type { OfferSectionWithItems } from '../../../core/types/offers';
import { FaqAccordion } from '../../common/faq-accordion/faq-accordion';

@Component({
  selector: 'app-offer-faq-section',
  imports: [FaqAccordion],
  templateUrl: './offer-faq-section.html',
  providers: [provideTranslocoScope('common')],
})
export class OfferFaqSection {
  readonly section = input.required<OfferSectionWithItems>();
  readonly items = input.required<readonly DisplayFaqItem[]>();
  readonly empty = createCommonEmptyI18n();
}
