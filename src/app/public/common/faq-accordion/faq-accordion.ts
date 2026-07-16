import { Component, input } from '@angular/core';

import { AccordionModule } from 'primeng/accordion';

import type { DisplayFaqItem } from '../../../core/types/faq-items';

@Component({
  selector: 'app-faq-accordion',
  imports: [AccordionModule],
  templateUrl: './faq-accordion.html',
})
export class FaqAccordion {
  readonly items = input.required<readonly DisplayFaqItem[]>();
}
