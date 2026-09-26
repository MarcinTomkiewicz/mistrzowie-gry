import { Component, input } from '@angular/core';

import { AccordionModule } from 'primeng/accordion';

import type { FaqAccordionItem } from '../../core/types/faq-items';
import type { RichContentInlineNode } from '../../core/types/rich-content';
import { InternalLinkText } from '../internal-link-text/internal-link-text';
import { RichContent } from '../rich-content/rich-content';
import { RichContentInline } from '../rich-content/rich-content-inline';

@Component({
  selector: 'app-faq-accordion',
  imports: [AccordionModule, InternalLinkText, RichContent, RichContentInline],
  templateUrl: './faq-accordion.html',
})
export class FaqAccordion {
  readonly items = input.required<readonly FaqAccordionItem[]>();

  protected isStructuredQuestion(
    question: FaqAccordionItem['h'],
  ): question is RichContentInlineNode[] {
    return typeof question !== 'string';
  }

  protected stopTargetToggle(event: Event): void {
    const target = event.target;
    const host = event.currentTarget;
    if (!(target instanceof Element) || !(host instanceof Element)) return;
    const interactive = target.closest('a, button');
    if (interactive && host.contains(interactive)) event.stopPropagation();
  }
}
