import { Component, input } from '@angular/core';

import type {
  CommercialBuilderSection,
  CommercialRenderProduct,
} from '../../core/types/commercial-page-builder';
import { CommercialPageBlock } from './commercial-page-block';
import { CommercialSectionHeader } from './commercial-section-header';

@Component({
  selector: 'app-commercial-page-section',
  imports: [CommercialPageBlock, CommercialSectionHeader],
  host: { class: 'd-block' },
  templateUrl: './commercial-page-section.html',
})
export class CommercialPageSection {
  readonly section = input.required<CommercialBuilderSection>();
  readonly products = input.required<readonly CommercialRenderProduct[]>();
  readonly locale = input.required<string>();
  readonly pricingFootnote = input.required<string | null>();
}
