import { Component, input } from '@angular/core';

import { AccordionModule } from 'primeng/accordion';

import type { FaqAccordionItem } from '../../core/types/faq-items';
import type { RichContent as RichContentModel } from '../../core/types/rich-content';
import { InternalLinkText } from '../internal-link-text/internal-link-text';
import { RichContent } from '../rich-content/rich-content';

@Component({
  selector: 'app-faq-accordion',
  imports: [AccordionModule, InternalLinkText, RichContent],
  templateUrl: './faq-accordion.html',
})
export class FaqAccordion {
  readonly items = input.required<readonly FaqAccordionItem[]>();

  protected isStructuredAnswer(
    answer: FaqAccordionItem['a'],
  ): answer is RichContentModel {
    return typeof answer !== 'string';
  }
}
