import { Component, input } from '@angular/core';

import { AccordionModule } from 'primeng/accordion';

import type { DisplayFaqItem } from '../../../core/types/faq-items';
import { InternalLinkText } from '../internal-link-text/internal-link-text';

@Component({
  selector: 'app-faq-accordion',
  imports: [AccordionModule, InternalLinkText],
  templateUrl: './faq-accordion.html',
})
export class FaqAccordion {
  readonly items = input.required<readonly DisplayFaqItem[]>();
}
